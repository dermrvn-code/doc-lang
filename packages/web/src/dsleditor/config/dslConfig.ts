
import { LogLevel } from '@codingame/monaco-vscode-api';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { useWorkerFactory } from 'monaco-languageclient/workerFactory';
import { type WorkerLoader } from 'monaco-languageclient/workerFactory';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import dslLanguageConfig from './dsl.configuration.json?raw';
import dslTextmateGrammar from '../../../../language/syntaxes/doc-lang.tmLanguage.json?raw';
import { dslExtension, languageId, dslpublisher, dslversion, exampleCode, codeUri } from '../languagespec.js';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';


export type OverallAppConfig = {
  vscodeApiConfig: MonacoVscodeApiConfig;
  languageClientConfig: LanguageClientConfig;
  editorAppConfig: EditorAppConfig;
};

export const setupDslClient = async (): Promise<OverallAppConfig> => {

  const extensionFilesOrContents = new Map<string, string | URL>();
  extensionFilesOrContents.set('/config/dsl-configuration.json', dslLanguageConfig);
  extensionFilesOrContents.set('/config/dsl-grammar.json', dslTextmateGrammar);




  const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
      $type: 'EditorService'
    },
    logLevel: LogLevel.Debug,
    serviceOverrides: {
      ...getKeybindingsServiceOverride()
    },
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'Default Light Modern',
        'editor.guides.bracketPairsHorizontal': 'active',
        'editor.lightbulb.enabled': 'On',
        'editor.wordBasedSuggestions': 'off',
        'editor.experimental.asyncTokenization': true,
        'editor.minimap.enabled': false

      })
    },
    monacoWorkerFactory: myconfigureDefaultWorkerFactory,
    extensions: [
      {
        config: {
          name: languageId + '-extension',
          publisher: dslpublisher,
          version: dslversion,
          engines: {
            vscode: '*'
          },
          contributes: {
            languages: [
              {
                id: languageId,
                extensions: [dslExtension],
                aliases: [languageId],
                configuration: '/config/dsl-configuration.json'
              }
            ],
            grammars: [
              {
                language: languageId,
                scopeName: 'source.' + languageId,
                path: '/config/dsl-grammar.json'
              }
            ]
          }
        },
        filesOrContents: extensionFilesOrContents
      }
    ]
  };


  const editorAppConfig: EditorAppConfig = {
    codeResources: {
      modified: {
        text: exampleCode,
        uri: codeUri
      }
    },
    languageDef: {
      languageExtensionConfig: {
        id: languageId,
        extensions: [dslExtension]
      }
    }
  };


  const loadDslWorker = () => {
    return new Worker(new URL('../worker/dsl-server.ts', import.meta.url), {
      type: 'module',
      name: languageId + ' LS'
    });
  };
  const worker = loadDslWorker();

  const reader = new BrowserMessageReader(worker);
  const writer = new BrowserMessageWriter(worker);
  reader.listen((message) => {
    console.log('Received message from worker:', message);
  });





  const languageClientConfig: LanguageClientConfig = {
    languageId: languageId,
    clientOptions: {
      documentSelector: [languageId]
    },
    connection: {
      options: {
        $type: 'WorkerDirect',
        worker
      },
      messageTransports: { reader, writer }
    }
  };


  return {
    editorAppConfig,
    vscodeApiConfig,
    languageClientConfig
  };
};



//  patch for loading workers from langguage-client
// instead of node_modules


const myconfigureDefaultWorkerFactory = (logger?: ILogger) => {
  useWorkerFactory({
    workerLoaders: mydefineDefaultWorkerLoaders(),
    logger
  });
};


const mydefineDefaultWorkerLoaders: () => Partial<Record<string, WorkerLoader>> = () => {
  const defaultEditorWorkerService = () => new MyWorker(
    new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
    { type: 'module' }
  );
  const defaultExtensionHostWorkerMain = () => new MyWorker(
    new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url),
    { type: 'module' }
  );
  const defaultTextMateWorker = () => new MyWorker(
    new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
    { type: 'module' }
  );

  return {
    // if you import monaco api as 'monaco-editor': monaco-editor/esm/vs/editor/editor.worker.js
    editorWorkerService: defaultEditorWorkerService,
    extensionHostWorkerMain: defaultExtensionHostWorkerMain,
    TextMateWorker: defaultTextMateWorker,
    // these are other possible workers not configured by default
    OutputLinkDetectionWorker: undefined,
    LanguageDetectionWorker: undefined,
    NotebookEditorWorker: undefined,
    LocalFileSearchWorker: undefined
  };
};


export class MyWorker {
  url: string | URL;
  options?: WorkerOptions;

  constructor(url: string | URL, options?: WorkerOptions) {
    this.url = url;
    this.options = options;
  }
}
