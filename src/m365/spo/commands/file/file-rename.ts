import { Cli } from '../../../../cli/Cli';
import { Logger } from '../../../../cli/Logger';
import Command, {
  CommandError
} from '../../../../Command';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { urlUtil } from '../../../../utils/urlUtil';
import { validation } from '../../../../utils/validation';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';
import { Options as SpoFileRemoveOptions } from './file-remove';
import { FileProperties } from './FileProperties';
const removeCommand: Command = require('./file-remove');

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  webUrl: string;
  sourceUrl: string;
  targetFileName: string;
  force?: boolean;
}

export interface FileDeleteError {
  error: CommandError;
  stderr: string;
}

interface RenameResponse {
  value: RenameResponseValue[];
}

interface RenameResponseValue {
  ErrorCode: number;
  ErrorMessage: string;
  FieldName: string;
  FieldValue: string;
  HasException: boolean;
  ItemId: number;
}

class SpoFileRenameCommand extends SpoCommand {
  public get name(): string {
    return commands.FILE_RENAME;
  }

  public get description(): string {
    return 'Renames a file';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        force: !!args.options.force
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-u, --webUrl <webUrl>'
      },
      {
        option: '-s, --sourceUrl <sourceUrl>'
      },
      {
        option: '-t, --targetFileName <targetFileName>'
      },
      {
        option: '--force'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => validation.isValidSharePointUrl(args.options.webUrl)
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    const webUrl = args.options.webUrl;
    const originalFileServerRelativeUrl: string = urlUtil.getServerRelativePath(args.options.webUrl, args.options.sourceUrl);

    try {
      await this.getFile(originalFileServerRelativeUrl, webUrl);

      if (args.options.force) {
        await this.deleteFile(webUrl, args.options.sourceUrl, args.options.targetFileName);
      }

      const requestBody: any = {
        formValues: [{
          FieldName: 'FileLeafRef',
          FieldValue: args.options.targetFileName
        }]
      };

      const requestOptions: any = {
        url: `${webUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(originalFileServerRelativeUrl)}')/ListItemAllFields/ValidateUpdateListItem()`,
        headers: {
          'accept': 'application/json;odata=nometadata'
        },
        data: requestBody,
        responseType: 'json'
      };

      const resp = await request.post<RenameResponse>(requestOptions);
      logger.log(resp.value);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }

  private getFile(originalFileServerRelativeUrl: string, webUrl: string): Promise<FileProperties> {
    const requestUrl = `${webUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(originalFileServerRelativeUrl)}')?$select=UniqueId`;
    const requestOptions: any = {
      url: requestUrl,
      headers: {
        'accept': 'application/json;odata=nometadata'
      },
      responseType: 'json'
    };
    return request.get(requestOptions);
  }

  private deleteFile(webUrl: string, sourceUrl: string, targetFileName: string): Promise<void> {
    const targetFileServerRelativeUrl: string = `${urlUtil.getServerRelativePath(webUrl, sourceUrl.substring(0, sourceUrl.lastIndexOf('/')))}/${targetFileName}`;

    const options: SpoFileRemoveOptions = {
      webUrl: webUrl,
      url: targetFileServerRelativeUrl,
      recycle: true,
      confirm: true,
      debug: this.debug,
      verbose: this.verbose
    };
    return Cli.executeCommandWithOutput(removeCommand as Command, { options: { ...options, _: [] } })
      .then(_ => {
        return Promise.resolve();
      }, (err: FileDeleteError) => {
        if (err.error !== null && err.error.message !== null && err.error.message.includes('does not exist')) {
          return Promise.resolve();
        }
        return Promise.reject(err);
      });
  }
}

module.exports = new SpoFileRenameCommand();
