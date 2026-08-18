import React from "react";

// Catches render/lifecycle errors in its subtree so one broken component
// (e.g. a WebGL context failure on a low-end/mobile device) can't take down
// the entire page with a blank white screen. Does NOT catch errors in event
// handlers, async callbacks, or outside React's render tree — those need
// their own try/catch.
export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
