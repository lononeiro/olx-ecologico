"use client";

import { useId, useState, type CSSProperties } from "react";

interface PasswordFieldProps {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
  inputStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
  buttonStyle?: CSSProperties;
}

export function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  disabled,
  error,
  hint,
  style,
  labelStyle,
  inputStyle,
  wrapperStyle,
  buttonStyle,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <div style={style}>
      <label htmlFor={inputId} style={labelStyle}>
        {label}
      </label>
      <div style={{ position: "relative", ...wrapperStyle }}>
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          style={{
            position: "absolute",
            right: ".85rem",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            color: "var(--auth-accent)",
            fontSize: ".8rem",
            fontWeight: 700,
            cursor: "pointer",
            ...buttonStyle,
          }}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {hint ? (
        <p style={{ color: "var(--auth-muted)", fontSize: ".75rem", marginTop: ".45rem", lineHeight: 1.5 }}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p style={{ color: "var(--auth-danger)", fontSize: ".78rem", marginTop: ".3rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
