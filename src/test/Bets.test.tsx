import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Bets from "../pages/Bets";
import { useMatches, useMyBets } from "../hooks/useMatches";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock dependencies
vi.mock("../hooks/useMatches", () => ({
  useMatches: vi.fn(),
  useMyBets: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: { id: "user-123" } })),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(() => ({ pathname: "/palpites" })),
  Link: ({ children, to }: any) => React.createElement("a", { href: to }, children),
}));

vi.mock("../integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ScrollIntoView mock for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Bets Component Default Date Index selection", () => {
  const getLocalDateStr = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayDateStr = getLocalDateStr(new Date());
  
  // 14 days ago (Opening date)
  const openingDate = new Date();
  openingDate.setDate(openingDate.getDate() - 14);
  const openingDateStr = getLocalDateStr(openingDate);

  // 1 day in the future
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const futureDateStr = getLocalDateStr(futureDate);

  const mockMatches = [
    {
      id: "match-1",
      team_a: "Brasil",
      team_b: "Croácia",
      match_date: openingDateStr,
      match_time: "17:00:00",
      multiplier: 1,
      status: "finished",
      flag_a: "",
      flag_b: "",
    },
    {
      id: "match-2",
      team_a: "Argentina",
      team_b: "França",
      match_date: todayDateStr,
      match_time: "15:00:00",
      multiplier: 1,
      status: "upcoming",
      flag_a: "",
      flag_b: "",
    },
    {
      id: "match-3",
      team_a: "Espanha",
      team_b: "Alemanha",
      match_date: futureDateStr,
      match_time: "18:00:00",
      multiplier: 1,
      status: "upcoming",
      flag_a: "",
      flag_b: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for useMyBets
    vi.mocked(useMyBets).mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as any);
  });

  it("should select today as default date even when matches load asynchronously", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // 1. Simular primeiro render com isLoading: true e matches vazios
    const mockUseMatches = vi.mocked(useMatches);
    
    mockUseMatches.mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    const { container, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Bets />
      </QueryClientProvider>
    );

    // Deve mostrar o loading spinner inicialmente
    expect(container.querySelector(".animate-spin")).toBeTruthy();

    // 2. Simular carregamento concluído (isLoading: false e matches populados)
    mockUseMatches.mockReturnValue({
      data: mockMatches,
      isLoading: false,
    } as any);

    rerender(
      <QueryClientProvider client={queryClient}>
        <Bets />
      </QueryClientProvider>
    );

    // O label de data selecionada deve ser "Hoje"
    const dateLabelElement = await screen.findByText(/HOJE/i);
    expect(dateLabelElement).toBeDefined();

    // Deve exibir o jogo marcado para hoje ("Argentina × França")
    expect(await screen.findByText("Argentina")).toBeDefined();
    expect(await screen.findByText("França")).toBeDefined();
    
    // NÃO deve exibir o jogo da abertura ("Brasil × Croácia")
    expect(screen.queryByText("Brasil")).toBeNull();
  });
});
