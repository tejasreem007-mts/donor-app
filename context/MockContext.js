"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const MockContext = createContext({
  isMockMode: false,
  toggleMockMode: () => {},
  dbStatus: "checking", // 'connected' | 'offline' | 'checking'
});

export function MockProvider({ children }) {
  const [isMockMode, setIsMockMode] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");

  useEffect(() => {
    // Check localStorage preference
    const savedMock = localStorage.getItem("donor_app_mock_mode");
    if (savedMock !== null) {
      setIsMockMode(savedMock === "true");
    } else if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
      setIsMockMode(true);
    }

    // Ping /api/hospitals to check live Oracle connectivity
    fetch("/api/hospitals")
      .then((res) => {
        if (res.ok) {
          setDbStatus("connected");
        } else {
          setDbStatus("offline");
        }
      })
      .catch(() => {
        setDbStatus("offline");
      });
  }, []);

  const toggleMockMode = () => {
    setIsMockMode((prev) => {
      const next = !prev;
      localStorage.setItem("donor_app_mock_mode", String(next));
      return next;
    });
  };

  return (
    <MockContext.Provider
      value={{
        isMockMode,
        toggleMockMode,
        dbStatus,
      }}
    >
      {children}
    </MockContext.Provider>
  );
}

export function useMock() {
  return useContext(MockContext);
}
