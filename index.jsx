import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { render } from "react-dom";
import { Audio } from 'react-loader-spinner';


import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/nns";

import { idlFactory } from "./assets.did";



const App = () => {
  const [connect, setConnect] = useState("");
  const [address, setAddress] = useState("");
  const [identity, setIdentity] = useState(null);
  const [loader, setLoader] = useState(false);

  const [assetcanisterid, setAssetCanisterId] = useState("");
  const [batch, setBatch] = useState(0);
  const [content, setContent] = useState(null);
  const [base64, setBase64] = useState("");
  const [buffer, setBuffer] = useState([]);

  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  let [value, setValue] = useState(0);
  const [file, setFile] = useState(null);
  const [_type, setType] = useState("");
  const [name, setName] = useState("");

  const [filesData, setFilesData] = useState([]);

  //Folder Upload Test
  const folderRef = useRef(null);
  const [folder, setFolder] = useState(0);

  useEffect(() => {
    async function checkConnection() {
      if (identity == null) {
        let i = await nfidConnect();
        let p = i.getPrincipal();
        setAddress(p.toString());
        setIdentity(i);
        // console.log(Principal.toSring(i.getPrincipal()));
        setConnect("Connected!");
      } else {
        // console.log(Principal.toSring(i.getPrincipal()));
        setConnect("Connected!");
      }
    }
    checkConnection();
  }, []);

  const nfidConnect = async (event) => {
    const APPLICATION_NAME = "IC_GAMES_DEPLOYER";
    const APPLICATION_LOGO_URL = "https://superfind.io/logo37.png"; // change to plethora.zone
    const APP_META = `applicationName=RequestTransfer&applicationLogo=${APPLICATION_LOGO_URL}`;
    const AUTH_PATH = "/authenticate/?applicationName=" + APPLICATION_NAME + "#authorize";
    const NFID_AUTH_URL = "https://nfid.one" + AUTH_PATH;
    const NFID_ORIGIN = "https://nfid.one";
    const REQ_TRANSFER = "wallet/request-transfer";

    const authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
      return authClient.getIdentity();
    }
    await new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: NFID_AUTH_URL,
        windowOpenerFeatures:
          `left=${window.screen.width / 2 - 525 / 2}, ` +
          `top=${window.screen.height / 2 - 705 / 2},` +
          `toolbar=0,location=0,menubar=0,width=525,height=705`,
        onSuccess: resolve,
        onError: reject,
      });
    });
    let identity = authClient.getIdentity();
    // setIdentity(identity);
    return identity;
  };

  const wallet_connect = async (event) => {
    const APPLICATION_NAME = "IC_GAMES_DEPLOYER";
    const APPLICATION_LOGO_URL = "https://superfind.io/logo37.png"; // change to plethora.zone
    const APP_META = `applicationName=RequestTransfer&applicationLogo=${APPLICATION_LOGO_URL}`;
    const AUTH_PATH = "/authenticate/?applicationName=" + APPLICATION_NAME + "#authorize";
    const NFID_AUTH_URL = "https://nfid.one" + AUTH_PATH;
    const NFID_ORIGIN = "https://nfid.one";
    const REQ_TRANSFER = "wallet/request-transfer";

    const authClient = await AuthClient.create();
    // if (await authClient.isAuthenticated()) {
    //   return authClient.getIdentity();
    // }
    await new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: NFID_AUTH_URL,
        windowOpenerFeatures:
          `left=${window.screen.width / 2 - 525 / 2}, ` +
          `top=${window.screen.height / 2 - 705 / 2},` +
          `toolbar=0,location=0,menubar=0,width=525,height=705`,
        onSuccess: resolve,
        onError: reject,
      });
    });
    let identity = authClient.getIdentity();
    // setIdentity(identity);
    return identity;
  };

  //To upload File : Testing
  const uploadFiles = async () => {
    if (identity == null) {
      alert("Connect NFID!");
      return;
    }
    const agent = new HttpAgent({
      identity: identity,
      host: "https://ic0.app/",
    });
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: assetcanisterid,
    });

    try {
      for (let i = 0; i < filesData.length; i++) {
        console.log(filesData[i]);
        const res1 = await actor.create_batch();
        const file = filesData[i];
        const chunks = [];
        for (let i = 0; i < file.fileArr.length; i++) {
          const _req2 = {
            content: file.fileArr[i],
            batch_id: Number(res1.batch_id),
          };
          const res2 = await actor.create_chunk(_req2);
          chunks.push(Number(res2.chunk_id));
        };
        console.log(chunks);
        var n = "/" + String(encodeURI(file.fileName));
        await actor.commit_asset_upload(res1.batch_id, String(n), file.fileType, chunks);
      }
    }
    catch (err) {
      alert(err);
      setLoader(false)
    }
  };

  const b64toArrays = (base64) => {
    let encoded = base64.toString().replace(/^data:(.*,)?/, '');
    if ((encoded.length % 4) > 0) {
      encoded += '='.repeat(4 - (encoded.length % 4));
    }
    setBase64(encoded);
    const byteCharacters = Buffer.from(encoded, 'base64');
    const byteArrays = [];
    const sliceSize = 1000000;

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const byteArray = [];
      let x = offset + sliceSize;
      if (byteCharacters.length < x) {
        x = byteCharacters.length;
      }
      for (let i = offset; i < x; i++) {
        byteArray.push(byteCharacters[i]);
      }
      byteArrays.push(byteArray);
    }
    return byteArrays;
  }

  const b64toType = (base64) => {
    let type = "";
    let encode = base64.toString();
    let f = false;
    for (let i = 0; i < encode.length; i++) {
      if (encode[i] == ":") {
        f = true;
      } else if (f & encode[i] != ";") {
        type += encode[i];
      }
      if (encode[i] == ";") {
        break;
      }
    }
    return type;
  };

  const handleUpload = (event) => {
    setReady(false);
    const folder = Array.from(folderRef.current.files);
    if (folder.size == 0) {
      setReady(false);
      alert("Empty Folder");
    }
    let files = [];
    folder.forEach((file) => {
      let fileName = "";
      let fileType = "";
      let fileArr = [];
      // Make new FileReader
      const reader = new FileReader();
      // Convert the file to base64 text
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        // if (reader.result === null) {
        //   throw new Error('file empty...');
        // }
        let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
        if ((encoded.length % 4) > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        fileArr = b64toArrays(reader.result);
        fileType = b64toType(reader.result);
        fileName = file.webkitRelativePath;
        console.log(fileName + ' | ' + Math.round(file.size / 1000) + ' kB');
        files.push({ fileArr, fileName, fileType });
        // setReady(true);
      };
      setFilesData(files);
    });
    setReady(true);
  };





  const handleFolderChange = () => {
    const files = Array.from(folderRef.current.files);
    // setFolder(files);
    console.log(files);
    files.forEach((file) => {
      console.log(file.webkitRelativePath);
    });
    return files;
  };

  return (
    <div style={{ "fontSize": "30px" }}>
      <div style={{ "display": "flex", "justifyContent": "center" }}>
        <div style={{ marginRight: 50 }}>
          {
            loader && (<Audio
              height="30"
              width="30"
              radius="9"
              color='green'
              ariaLabel='three-dots-loading'
              wrapperStyle
              wrapperClass
            />)
          }
        </div>
        <div>
          <button
            style={{ backgroundColor: "", cursor: 'pointer', marginTop: 20, marginBottom: 20, width: 150, height: 30 }}
            className=""
            onClick={wallet_connect}>
            Connect NFID
          </button>
        </div>
        <div>{address}</div>
      </div>
      <br></br>
      <div>
        Upload Games Assets :
        <div>
          <div><input
            name="asset canister id"
            placeholder="Asset Canister Id?"
            required
            onChange={(event) => setAssetCanisterId(event.target.value)}
          ></input></div>
          <div className="drag-text">
            {/* <input className="file-upload-input" type='file' onChange={handleChange} /> */}
            <input ref={folderRef} type="file" webkitdirectory="true" onChange={handleUpload} />
            {/* <p>{folder} KB : Size</p> */}
            {/* <img src='http://100dayscss.com/codepen/upload.svg' className='upload-icon' /> */}
          </div>
          {/* <div><input
            name="file type"
            placeholder="File Type?"
            required
            onChange={(event) => setType(event.target.value)}
          ></input></div> */}
          {!!ready &&
            <button className="file-upload-btn" type="button" onClick={uploadFiles} >Upload</button>
          }
        </div>
      </div>
    </div>
  );
};

render(<App />, document.getElementById("app"));
