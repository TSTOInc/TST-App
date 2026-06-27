// components/PDFPreview.jsx
"use client";

import React from "react";

const PDFPreview = ({ fileUrl, width = 200 }) => {
  const pageRatio = 27.94 / 21.59; // height / width for US Letter
  const height = width * pageRatio;

  return (
    <iframe
      src={fileUrl}
      width={width}
      height={height}
      style={{
        border: "none",
        pointerEvents: "none", // disables interaction
        userSelect: "none",
        display: "block",
        overflow: "hidden", // prevent scrollbar if possible
      }}
    />
  );
};

export default PDFPreview;
