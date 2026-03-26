import React from "react"

export const LoginBackground: React.FC = () => (
  <>
    {/* Fondos animados */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full animate-float" />
      <div className="absolute top-40 right-32 w-24 h-24 bg-accent/10 rounded-full animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-32 left-32 w-40 h-40 bg-primary/5 rounded-full animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-20 right-20 w-28 h-28 bg-accent/5 rounded-full animate-float" style={{ animationDelay: "0.5s" }} />
    </div>
  </>
)
