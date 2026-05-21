
import { startMonacoEditor, getCurrentCode } from './dsleditor/maindsl.js';

const update = () => {
  updateSummary();

}

const updateSummary = async () => {
  const summaryelem = document.getElementById("summary");
  if (summaryelem != null) {
    const code = getCurrentCode();
    

    summaryelem.textContent = "";
  }
};

export const runDsl = async () => {
  try {
    await startMonacoEditor(document.getElementById('monaco-editor-root')!);
    document.getElementById('button-update')?.addEventListener('click', update);
  } catch (e) {
    console.error(e);
  }
};
