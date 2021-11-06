/* eslint-disable no-alert */
import { Button, LinearProgress } from "@material-ui/core";
import Editor from "@monaco-editor/react";
import React, {
  useEffect,
  Dispatch,
  SetStateAction,
  useState,
  useRef,
  useMemo,
} from "react";
import useTranslation from "hooks/translation";
import PlayArrow from "@material-ui/icons/PlayArrow";
import { useDarkTheme } from "hooks/darkTheme";
import { XTerm } from "xterm-for-react";
import { FitAddon } from "xterm-addon-fit";
import CodeRunner from "lib/playground/codeRunner";
import PythonCodeRunner from "lib/playground/pythonCodeRunner";
import PistonCodeRunner from "lib/playground/pistonCodeRunner";
import classes from "./style.module.css";

let loading = false;

export default function PlaygroundEditor({
  language,
  code,
  setCode,
}: {
  language: string;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
}) {
  const t = useTranslation();
  const [darkTheme] = useDarkTheme();
  const xtermRef = useRef<XTerm>();
  const [ready, setReady] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const codeRunner = useMemo<CodeRunner>(() => {
    let runner: CodeRunner;
    switch (language) {
      case "python":
        runner = new PythonCodeRunner(xtermRef, t);
        break;

      default:
        runner = new PistonCodeRunner(xtermRef, t);
        break;
    }
    setTimeout(() => {
      runner.load(code, language).then((r) => {
        setReady(true);
        setDisabled(!r);
      });
    });
    return runner;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fitAddon = useMemo(() => new FitAddon(), []);

  function resizeHandler() {
    fitAddon.fit();
  }

  useEffect(() => {
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  });

  useEffect(() => {
    (async () => {
      if (loading) return;
      loading = true;
      if (!process.browser) return;
      xtermRef.current.terminal.writeln(`${t("playgroundWelcome")}\n`);

      setReady(true);
    })();
  }, [code, t]);

  return (
    <div className={classes.root}>
      <LinearProgress
        style={{
          opacity: ready ? 0 : 1,
          position: "absolute",
          width: "100%",
          zIndex: 10000,
        }}
      />
      <div className={classes.editor}>
        <Editor
          language={language}
          value={code}
          onChange={setCode}
          options={{
            automaticLayout: true,
            padding: {
              top: 15,
              bottom: 15,
            },
          }}
          theme={darkTheme ? "vs-dark" : "vs-light"}
        />
        <Button
          disabled={!ready || disabled}
          onClick={() => {
            setDisabled(true);
            codeRunner.run(code).finally(() => {
              setDisabled(false);
            });
          }}
          className={classes.runBtn}
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
        >
          {t("playgroundRunCode")}
        </Button>
      </div>
      <div className={classes.output}>
        <XTerm
          className={classes.xterm}
          ref={xtermRef}
          options={{ convertEol: true }}
          addons={[fitAddon]}
          onKey={(event) => {
            if (event.domEvent.ctrlKey && event.domEvent.code === "KeyC") {
              event.domEvent.preventDefault();
              navigator.clipboard.writeText(
                xtermRef.current.terminal.getSelection()
              );
            }
          }}
        />
      </div>
    </div>
  );
}
