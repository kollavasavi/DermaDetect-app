import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Detect if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as installed app
    if (window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      console.log("📌 Install prompt captured");
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // When app is installed
    window.addEventListener("appinstalled", () => {
      console.log("✅ App Installed!");
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log("No install prompt available");
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response: ${outcome}`);
      
      if (outcome === "accepted") {
        console.log("🎉 User accepted the install");
        setIsInstalled(true);
        setShowInstallButton(false);
      } else {
        console.log("❌ User dismissed the install");
      }
      
      // Clear the prompt
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Install error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img
            src="/android-chrome-192x192.png"
            alt="DermaDetect Logo"
            style={styles.logo}
          />
        </div>

        <h1 style={styles.appName}>DermaDetect</h1>

        <p style={styles.description}>
          Smart AI-powered skin condition detection & medical insights.
        </p>

        <button onClick={() => navigate("/login")} style={styles.getStartedBtn}>
          Get Started
        </button>

        {/* Show install button at bottom if available */}
        {!isInstalled && showInstallButton && (
          <button onClick={handleInstall} style={styles.installBtnBottom}>
            Install
            <br />
            <span style={styles.installSubtext}>DermaDetect</span>
            <br />
            <span style={styles.installNote}>Get the app for a...</span>
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "40px 30px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  logo: {
    width: "120px",
    height: "120px",
    borderRadius: "26px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  appName: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    margin: "0 0 16px 0",
    letterSpacing: "-0.5px",
  },
  description: {
    fontSize: "15px",
    color: "#6b7280",
    marginBottom: "32px",
    lineHeight: "1.6",
    padding: "0 10px",
  },
  getStartedBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
    marginBottom: "16px",
  },
  installBtnBottom: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    lineHeight: "1.4",
  },
  installSubtext: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937",
  },
  installNote: {
    fontSize: "12px",
    fontWeight: "400",
    color: "#9ca3af",
  }
};

export default Home;