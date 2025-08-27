import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { SocketProvider } from "./context/SocketProvider";
import { AppProvider, useAuth } from "./context/app.context.jsx";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

function SocketBridge({ children }) {
  const { user } = useAuth(); // lấy user từ AppProvider
  return <SocketProvider user={user}>{children}</SocketProvider>;
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SocketBridge>
            <App />
          </SocketBridge>
        </QueryClientProvider>
      </BrowserRouter>
    </AppProvider>
  </StrictMode>
);
