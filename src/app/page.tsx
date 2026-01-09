"use client";

import { useState, useMemo } from "react";
import {
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Inventory2, Circle } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import MaterialRequestCard from "@/components/MaterialRequestCard";

const MATERIAL_TYPES = [
  { value: "ROH", label: "Componentes" },
  { value: "HALB", label: "Semiterminados" },
];

interface MaterialRequest {
  _id: string;
  plantCode: string;
  sapMaterial: string;
  stationName: string;
  macAddress: string;
  requestTime: string;
  quantity: number;
  type: string;
  area: string;
  responseTime?: string;
  status: string;
}

const fetchMaterialRequests = async (): Promise<MaterialRequest[]> => {
  const response = await fetch("/api/material-requests");
  if (!response.ok) {
    throw new Error("Failed to fetch material requests");
  }
  return response.json();
};

export default function Home() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["ROH", "HALB"]);

  const {
    data: requests = [],
    isLoading,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ["materialRequests"],
    queryFn: fetchMaterialRequests,
    refetchInterval: 1000, // Auto-refresh every second
    refetchIntervalInBackground: true, // Keep fetching even when tab not focused
  });

  const filteredRequests = useMemo(() => {
    if (selectedTypes.length === 0) return requests;
    return requests.filter((r) => selectedTypes.includes(r.type));
  }, [requests, selectedTypes]);

  // Group requests by area
  const groupedByArea = useMemo(() => {
    const groups: Record<string, MaterialRequest[]> = {};
    filteredRequests.forEach((request) => {
      if (!groups[request.area]) {
        groups[request.area] = [];
      }
      groups[request.area].push(request);
    });
    // Sort areas alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRequests]);

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTypes: string[]
  ) => {
    setSelectedTypes(newTypes);
  };

  return (
    <>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Inventory2 sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
           TMES - SOLICITUDES DE MATERIALES
          </Typography>
          <ToggleButtonGroup
            value={selectedTypes}
            onChange={handleTypeChange}
            size="small"
            sx={{ mr: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
          >
            {MATERIAL_TYPES.map((type) => (
              <ToggleButton
                key={type.value}
                value={type.value}
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&.Mui-selected": {
                    bgcolor: "success.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "success.dark",
                    },
                  },
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {type.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Chip
            label={`${filteredRequests.length} Activos`}
            color="success"
            size="small"
            sx={{ mr: 2 }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Circle
              sx={{
                fontSize: 12,
                color: error ? "error.main" : "success.light",
                animation: isSuccess ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.4 },
                  "100%": { opacity: 1 },
                },
              }}
            />
            <Typography variant="body2" sx={{ color: "inherit" }}>
              {error ? "Disconnected" : "Live"}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2 }}>
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "50vh",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : "An error occurred"}
          </Alert>
        )}

        {!isLoading && !error && filteredRequests.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No se encontraron solicitudes de materiales
            </Typography>
          </Paper>
        )}

        {!isLoading && !error && filteredRequests.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {groupedByArea.map(([area, areaRequests]) => (
              <Box key={area}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                    pb: 1,
                    borderBottom: "2px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {area}
                  </Typography>
                  <Chip
                    label={areaRequests.length}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Grid container spacing={2}>
                  {areaRequests.map((request) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 1.5 }} key={request._id}>
                      <MaterialRequestCard request={request} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
