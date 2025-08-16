// components/PDFPreview.jsx
"use client";

import React from "react";

const PDFPreview = ({ fileUrl, width = 200 }) => {
  const pageRatio = 11 / 8.5; // height / width for US Letter
  const height = width * pageRatio;

  return (
    <iframe
      src={fileUrl}
      width={width}
      height={height}
      style={{
        border: "none",
        pointerEvents: "none", // disables all interactions
        userSelect: "none",
        display: "block",
      }}
    />
  );
};

export default PDFPreview;
