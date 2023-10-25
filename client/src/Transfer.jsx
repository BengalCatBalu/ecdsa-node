import React, { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";
import { toHex } from "ethereum-cryptography/utils";
import { Modal, Input } from "antd";

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState(
    "Please enter your private key to sign the transaction:"
  );

  const showModal = () => {
    setOpen(true);
  };

  const handleOk = async () => {
    if (!privateKey) {
      setModalText("Error: Private Key is required to proceed.");
      return;
    }
    setConfirmLoading(true);
    await transfer(privateKey);
    setPrivateKey(""); // Clear the private key after use
    setConfirmLoading(false);
    setOpen(false);
  };

  const handleCancel = () => {
    console.log("Clicked cancel button");
    setPrivateKey(""); // Clear the private key after use
    setConfirmLoading(false);
    setOpen(false);
  };

  async function handleTransfer(evt) {
    evt.preventDefault();
    setModalText("Please enter your private key to sign the transaction:");
    showModal();
  }

  async function transfer(privateKey) {
    try {
      // 1. Получаем публичный ключ пользователя с сервера
      const response = await server.get(`/getPublicKey/${address}`);
      if (!response.data || !response.data.publicKey) {
        throw new Error("Failed to fetch public key.");
      }
      const publicKey = response.data.publicKey;

      // 2. Создаем подпись
      const signing = await secp256k1.sign(
        address + sendAmount + recipient,
        privateKey
      );

      // Проверяем подпись на стороне клиента
      const isSignatureValid = secp256k1.verify(
        signing,
        address + sendAmount + recipient,
        publicKey
      );

      if (!isSignatureValid) {
        throw new Error(
          "Signature validation failed. Possibly the wrong private key?"
        );
      }

      // 3. Если проверка успешна, отправляем транзакцию на сервер
      const {
        data: { balance },
      } = await server.post(`/send`, {
        sender: address,
        amount: parseInt(sendAmount),
        recipient: recipient,
      });
      setBalance(balance);
    } catch (ex) {
      alert("Failed to send transaction.")
      console.error(ex);
    }
  }

  return (
    <form className="container transfer">
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <Modal
        title="Private Key Confirmation"
        onOk={handleOk}
        visible={open}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <p>{modalText}</p>
        <Input
          placeholder="Enter your private key"
          type="password" // Hide the input
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
      </Modal>

      <input
        type="button"
        className="button"
        value="Transfer"
        onClick={handleTransfer}
      />
    </form>
  );
}

export default Transfer;
