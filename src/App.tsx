import "./styles.css";
import React, { useEffect } from "react";
import { useImmer } from "use-immer";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

// https://marvel.bb.io/c/AWZRXTHAEY
const REDEEM_BASE = "https://www.marvel.com/redeem?redeemcode=";

function stripCode(url: string): string {
  const finalSlash = url.lastIndexOf("/");
  return url.substring(finalSlash + 1);
}

export default function App() {
  const [data, setData] = useImmer<string[]>([]);

  useEffect(() => {
    let controls: IScannerControls;

    async function startScanner() {
      const codeReader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      devices.forEach((element) => {
        console.log(element);
      });

      const previewElem = document.querySelector(
        "#test-area-qr-code-webcam > video"
      ) as HTMLVideoElement;

      controls = await codeReader.decodeFromVideoDevice(
        undefined,
        previewElem,
        (result, error) => {
          if (result) {
            const text = stripCode(result.getText());
            setData((draft) => {
              if (!draft.includes(text)) {
                draft.push(text);
                navigator.vibrate?.([100, 100, 300]);
              }
            });
          }
        }
      );
    }
    startScanner();

    return () => {
      controls?.stop();
    };
  }, []);
  return (
    <div>
      <h1>
        <a href={REDEEM_BASE + data.join(",")} target="_blank">
          REDEEM
        </a>
      </h1>
      <div>
        Scanned {data.length} codes. Latest: {data[data.length - 1] ?? "(none)"}
      </div>
      <div id="test-area-qr-code-webcam" style={{ display: "block" }}>
        <video style={{ width: "100%" }}></video>
      </div>
    </div>
  );
}
