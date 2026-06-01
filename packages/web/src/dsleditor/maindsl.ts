/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import type { OverallAppConfig } from './config/dslConfig.js';
import { setupDslClient } from './config/dslConfig.js';
import { EditorApp } from 'monaco-languageclient/editorApp';


var editorApp = null as EditorApp | null;

export const startMonacoEditor = async (htmlContainer: HTMLElement) => {
  try {

    // provides all configs needed here 
    const overallAppConfig: OverallAppConfig = await setupDslClient();


    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(overallAppConfig.vscodeApiConfig);
    await apiWrapper.start();



    // init language client
    // contains the connection to the language server (worker)
    const lcWrapper = new LanguageClientWrapper(overallAppConfig.languageClientConfig);
    await lcWrapper.start();

    // init editor app
    editorApp = new EditorApp(overallAppConfig.editorAppConfig);
    await editorApp.start(htmlContainer);

  } catch (e) {
    console.error(e);
  }
};



export function getCurrentCode(): string {
  console.log("Getting current code from editor...");
  return editorApp?.getEditor()?.getModel()?.getValue() ?? "";
}
