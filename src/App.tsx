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
      <h1 className="text-3xl">REDEEMER</h1>
      <div id="test-area-qr-code-webcam" style={{ display: "block" }}>
        <video style={{ width: "100%" }}></video>
      </div>
      <h2>Results</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <a href={REDEEM_BASE + data.join(",")} target="_blank">
        Redeem All
      </a>
    </div>
  );
}
