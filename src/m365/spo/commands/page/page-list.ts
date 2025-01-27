import { Logger } from '../../../../cli/Logger';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { validation } from '../../../../utils/validation';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  webUrl: string;
}

class SpoPageListCommand extends SpoCommand {
  public get name(): string {
    return commands.PAGE_LIST;
  }

  public get description(): string {
    return 'Lists all modern pages in the given site';
  }

  public defaultProperties(): string[] | undefined {
    return ['Name', 'Title'];
  }

  constructor() {
    super();

    this.#initOptions();
    this.#initValidators();
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-u, --webUrl <webUrl>'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => validation.isValidSharePointUrl(args.options.webUrl)
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      if (this.verbose) {
        logger.logToStderr(`Retrieving client-side pages...`);
      }
  
      let requestOptions: any = {
        url: `${args.options.webUrl}/_api/sitepages/pages?$orderby=Title`,
        headers: {
          accept: 'application/json;odata=nometadata'
        },
        responseType: 'json'
      };
  
      let pages: any[] = [];

      const pagesList = await request.get<{ value: any[] }>(requestOptions);

      requestOptions = {
        url: `${args.options.webUrl}/_api/web/lists/SitePages/rootfolder/files?$expand=ListItemAllFields/ClientSideApplicationId&$orderby=Name`,
        headers: {
          accept: 'application/json;odata=nometadata'
        },
        responseType: 'json'
      };

      if (pagesList.value && pagesList.value.length > 0) {
        pages = pagesList.value;
      }

      const res = await request.get<{ value: any[] }>(requestOptions);
      if (res.value && res.value.length > 0) {
        const clientSidePages: any[] = res.value.filter(p => p.ListItemAllFields.ClientSideApplicationId === 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec');
        pages = pages.map(p => {
          const clientSidePage = clientSidePages.find(cp => cp && cp.ListItemAllFields && cp.ListItemAllFields.Id === p.Id);
          if (clientSidePage) {
            return {
              ...clientSidePage,
              ...p
            };
          }

          return p;
        });

        logger.log(pages);
      }
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }
}

module.exports = new SpoPageListCommand();