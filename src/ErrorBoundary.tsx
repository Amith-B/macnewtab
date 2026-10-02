import React, { Component, ErrorInfo, ReactNode } from "react";
import { exportData } from "./utils/dataManagement";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  private handleExport = async () => {
    try {
      await exportData();
    } catch (e) {
      console.error("Failed to export data", e);
      alert("Failed to export backup. Data may be too corrupted.");
    }
  };

  private handleDownloadErrorLog = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorDetails = `
Error Name: ${error.name}
Error Message: ${error.message}
Stack Trace:
${error.stack}

Component Stack:
${errorInfo?.componentStack || "Not available"}
    `.trim();

    const blob = new Blob([errorDetails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macnewtab-error-log.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            backgroundColor: "#1e1e1e",
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: "24px" }}>Something went wrong.</h2>
          <div
            style={{
              maxWidth: "600px",
              marginBottom: "20px",
              color: "#ccc",
              lineHeight: "1.6",
              textAlign: "left",
              backgroundColor: "#2a2a2a",
              padding: "20px",
              borderRadius: "8px",
              width: "100%",
            }}
          >
            <p style={{ marginTop: 0, marginBottom: "15px", fontSize: "15px" }}>
              The extension encountered an unexpected error (likely corrupted
              local data). To get back up and running:
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "1px solid #444",
              }}
            >
              <div>
                <strong style={{ color: "white" }}>1. Help us fix this</strong>
                <br />
                <span style={{ fontSize: "13px", color: "#aaa" }}>
                  Download the error log and email it to{" "}
                  <a
                    href="mailto:amithbr6@gmail.com"
                    style={{ color: "#3498db" }}
                  >
                    amithbr6@gmail.com
                  </a>
                </span>
              </div>
              <button
                onClick={this.handleDownloadErrorLog}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f39c12",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginLeft: "15px",
                  whiteSpace: "nowrap",
                }}
              >
                Download Error Log
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "1px solid #444",
              }}
            >
              <div>
                <strong style={{ color: "white" }}>2. Save your data</strong>
                <br />
                <span style={{ fontSize: "13px", color: "#aaa" }}>
                  Download a backup of your settings so you don't lose them.
                </span>
              </div>
              <button
                onClick={this.handleExport}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginLeft: "15px",
                  whiteSpace: "nowrap",
                }}
              >
                Download Backup
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong style={{ color: "white" }}>3. Reset</strong>
                <br />
                <span style={{ fontSize: "13px", color: "#aaa" }}>
                  Clear the corruption and restart the extension.
                </span>
              </div>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ff4757",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginLeft: "15px",
                  whiteSpace: "nowrap",
                }}
              >
                Reset Settings
              </button>
            </div>
          </div>

          <details
            style={{
              whiteSpace: "pre-wrap",
              backgroundColor: "#333",
              padding: "10px",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "100%",
              textAlign: "left",
              maxHeight: "200px",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <summary style={{ cursor: "pointer", color: "#ff8c00" }}>
              View Error Details
            </summary>
            {this.state.error && this.state.error.toString()}
            {this.state.errorInfo && (
              <div style={{ marginTop: 10, fontSize: "12px", color: "#aaa" }}>
                {this.state.errorInfo.componentStack}
              </div>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
