import React from "react";

const buttonStyle = {
  margin: "10px 15px",
};

const Button = ({ label, handleClick }) => (
  <button className="btn btn-default" style={buttonStyle} onClick={handleClick}>
    {label}
  </button>
);

export default Button;
