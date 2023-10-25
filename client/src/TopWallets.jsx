import React, { useState, useEffect } from "react";
import { Table } from "antd";
import server from "./server"; // предполагаем, что у вас есть файл server.js для работы с сервером

function TopWallets() {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    async function fetchTopWallets() {
      try {
        const response = await server.get("/topWallets");
        setWallets(response.data);
      } catch (error) {
        console.error("Failed to fetch top wallets:", error);
      }
    }

    fetchTopWallets();
  }, []);

  const columns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Balance",
      dataIndex: "amount",
      key: "amount",
    },
  ];

  return (
    <div className="container rating">
      <h2>Top 5 Wallets</h2>
      <Table
        dataSource={wallets}
        columns={columns}
        rowKey="address"
        pagination={false}
      />
      <a
        href="https://github.com/BengalCatBalu"
        target="_blank"
        rel="noopener noreferrer"
      >
        <input type="button" className="button" value="Github" />
      </a>
    </div>
  );
}

export default TopWallets;
