"use client";

import { fetchApi } from "@/tools/axios.tools";
import { useEffect, useState } from "react";

const Home = () => {
  const [folders, setFolders] = useState<null | string[]>(null);

  const listFolders = async (): Promise<string[] | null> => {
    const response = await fetchApi<string[]>({
      url: "/aplb/folders",
      method: "GET",
    });
    console.log("Folders:", response);
    if (response.success) {
      return response.data;
    } else {
      return null;
    }
  };

  const initialize = async () => {
    const folders = await listFolders();
    setFolders(folders);
  };

  useEffect(() => {
    // Initialize the page
    initialize();
  }, []);

  return (
    <div>
      <h1>Welcome to OpenBucket</h1>
      {folders ? (
        folders.map((folder, index) => (
          <div key={index} className="folder-item">
            <h2>{folder}</h2>
          </div>
        ))
      ) : (
        <p>Loading folders...</p>
      )}
    </div>
  );
};

export default Home;
