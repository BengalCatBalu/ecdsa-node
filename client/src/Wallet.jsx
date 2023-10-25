import React, { useState } from "react"; // добавьте useState, если вы его не импортировали ранее
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";
import { toHex } from "ethereum-cryptography/utils";
import { Modal } from "antd";

function Wallet({ address, setAddress, balance, setBalance }) {
  const [walletExists, setWalletExists] = useState(true); // Новое состояние для отслеживания существования кошелька
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };

  const handleOk = () => {
    setModalText("closing for 2 seconds");
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };

  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  async function onChange(evt) {
    const address = evt.target.value;
    setAddress(address);
    if (address) {
      try {
        const {
          data: { balance },
        } = await server.get(`balance/${address}`);
        setBalance(balance);
        setWalletExists(true); // кошелек существует
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setWalletExists(false); // кошелек не существует
        } else {
          console.error(err);
        }
        setBalance(0);
      }
    } else {
      setBalance(0);
    }
  }

  async function createNew() {
    if (address.length != 0) {
      const privateKey = secp256k1.utils.randomPrivateKey();
      const publicKey = secp256k1.getPublicKey(privateKey);
      setModalText(
        "Your private key - " + toHex(privateKey) + " your address - " + address
      );
      showModal();
      await server.post("/register", {
        address: address,
        publicKey: toHex(publicKey),
      });
    } else {
      setModalText(
        "Input Address"
      );
      showModal();
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Wallet Address
        <input
          placeholder="Type an address, for example: 0x1"
          value={address}
          onChange={onChange}
        ></input>
      </label>

      <div className="balance">Balance: {balance}</div>
      <Modal
        title="Title"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <p>{modalText}</p>
      </Modal>
      {/* Отображение кнопки создать кошелек */}
      {!walletExists && (
        <input
          type="submit"
          className="button"
          value="add"
          onClick={createNew}
        />
      )}
    </div>
  );
}

export default Wallet;
