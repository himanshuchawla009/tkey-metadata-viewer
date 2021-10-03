import MetadataStorageLayer from "@toruslabs/metadata-helpers";
import { decrypt as ecDecrypt } from "@toruslabs/eccrypto";
import ReactJsonView from "react-json-view"
import { useState } from 'react';

export async function decrypt(privKey, msg) {
  const bufferEncDetails = {
    ciphertext: Buffer.from(msg.ciphertext, "hex"),
    ephemPublicKey: Buffer.from(msg.ephemPublicKey, "hex"),
    iv: Buffer.from(msg.iv, "hex"),
    mac: Buffer.from(msg.mac, "hex"),
  };

  return ecDecrypt(privKey, bufferEncDetails);
}

const decryptMetadata = async (encMetadata, privKey) => {
  const encryptedMessage = JSON.parse(atob(encMetadata));

  let decrypted = await decrypt(Buffer.from(privKey, "hex"), encryptedMessage); // buffer

  return JSON.parse(decrypted.toString());
}
function App() {
  const [privKey, setPrivkey] = useState(null);
  const [postboxKeyMetadata, setPostboxKeyMetadata] = useState({})
  const [allSharesMetadata, setAllSharesMetadata] = useState({})

  const fetchMetadata = async (e) => {
    e.preventDefault(); 
    const md = new MetadataStorageLayer("https://metadata.tor.us");
    console.log("privkey", privKey)
    const params = md.generatePubKeyParams(privKey);
      const metadata = await md.getMetadata(params, "tkey");
      if (metadata) {
        const fetchedMetadata = await decryptMetadata(metadata, privKey);
        if (fetchedMetadata?.share?.share) {
          setPostboxKeyMetadata(fetchedMetadata)
          const params = md.generatePubKeyParams(fetchedMetadata.share.share);
          const secondarySharesMetadata = await md.getMetadata(params, "tkey");
          if (secondarySharesMetadata) {
            const secondaryDecMetadata = await decryptMetadata(secondarySharesMetadata, fetchedMetadata.share.share);
            setAllSharesMetadata(secondaryDecMetadata)
          }
        } else {
          setAllSharesMetadata(fetchedMetadata)
        }
      }
  }
  return (
    <div style={{ height: "100%", width: "100%"}} >
      <div style={{display: "flex", flexDirection: "column", justifyContent:"center", alignItems:"center"}}>
      <form onSubmit={fetchMetadata} style={{  padding: 40 }}>
        <input type="text" placeholder="Enter share or postbox key" required onChange={(e)=>setPrivkey(e.target.value)}></input>
        <button type="submit" disabled={!privKey}>Fetch Metadata</button>
      </form>
      <div style={{textAlign: "center"}}>
        <h2>Postbox Key Share</h2>
        <ReactJsonView src={postboxKeyMetadata}/>
      </div>
      <div style={{textAlign: "center"}}>
        <h2>Other shares metadata</h2>
        <ReactJsonView src={allSharesMetadata}/>
      </div>

      </div>
     
    </div>
  );
}

export default App;
