"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { Timer, Inventory, LocationOn, Label, Place } from "@mui/icons-material";
import Chip from "@mui/material/Chip";

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

interface MaterialRequestCardProps {
  request: MaterialRequest;
}

interface StorageBin {
  bin: string;         // e.g., "R18-H06"
  quantity: number;    // e.g., 149
}

interface StorageGroup {
  location: string;    // e.g., "0012"
  type: string;        // e.g., "VUL"
  bins: StorageBin[];
}

// Parse an ISO string that is stored with +00:00 but actually represents a GMT-6 local time.
const parseRequestTimeAssumingGMT6 = (requestTime: string): number => {
  const match = requestTime.match(
    /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/
  );

  if (!match) {
    return new Date(requestTime).getTime();
  }

  const [, year, month, day, hour, minute, second, milli = "0"] = match;

  const y = Number(year);
  const m = Number(month) - 1;
  const d = Number(day);
  const h = Number(hour);
  const min = Number(minute);
  const s = Number(second);
  const ms = Number(milli);

  return Date.UTC(y, m, d, h + 6, min, s, ms);
};

export default function MaterialRequestCard({ request }: MaterialRequestCardProps) {
  const [elapsed, setElapsed] = useState("");
  const [diffMinutes, setDiffMinutes] = useState(0);
  const [materialDescription, setMaterialDescription] = useState<string | null>(null);
  const [storageGroups, setStorageGroups] = useState<StorageGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch material data from ubicaciones API
  useEffect(() => {
    const fetchMaterialData = async () => {
      try {
        const response = await fetch('/api/ubicaciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sapMaterial: request.sapMaterial }),
        });
        const data = await response.json();
        console.log('Material data for', request.sapMaterial, ':', data);
        
        // Get material description
        if (data.materialDescription) {
          setMaterialDescription(data.materialDescription);
        }
        
        // Parse storage bins grouped by location and type
        // Structure: { "0012": { "VUL": { "BIN_NAME": { "GESME": qty } } }, "materialDescription": "..." }
        const groups: StorageGroup[] = [];
        
        Object.keys(data).forEach((storageLocation) => {
          if (storageLocation === 'materialDescription' || storageLocation === 'error') return;
          
          const storageTypes = data[storageLocation];
          if (typeof storageTypes === 'object') {
            Object.keys(storageTypes).forEach((storageType) => {
              const binData = storageTypes[storageType];
              if (typeof binData === 'object') {
                const bins: StorageBin[] = [];
                Object.keys(binData).forEach((binName) => {
                  const binInfo = binData[binName];
                  if (binInfo && typeof binInfo === 'object' && 'GESME' in binInfo) {
                    bins.push({
                      bin: binName,
                      quantity: binInfo.GESME,
                    });
                  }
                });
                if (bins.length > 0) {
                  groups.push({
                    location: storageLocation,
                    type: storageType,
                    bins,
                  });
                }
              }
            });
          }
        });
        
        setStorageGroups(groups);
      } catch (error) {
        console.error("Error fetching material data:", error);
        setMaterialDescription(null);
        setStorageGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterialData();
  }, [request.sapMaterial]);

  useEffect(() => {
    const calculateElapsed = () => {
      const nowUtc = Date.now();
      const requestUtc = parseRequestTimeAssumingGMT6(request.requestTime);
      const diff = nowUtc - requestUtc;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDiffMinutes(diff / (1000 * 60));

      if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setElapsed(`${minutes}m ${seconds}s`);
      } else {
        setElapsed(`${seconds}s`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [request.requestTime]);

  const getTimerColor = () => {
    if (diffMinutes < 5) return "success.main";
    if (diffMinutes < 15) return "warning.main";
    return "error.main";
  };

  return (
    <Card
      sx={{
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Station Name + Area on same line */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {request.stationName}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocationOn sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography variant="body2" color="text.secondary">
              {request.area}
            </Typography>
          </Box>
        </Box>

        {/* Material Description + SAP Number - Orange background with marquee */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.5,
            bgcolor: materialDescription ? "#ff9800" : "grey.400",
            color: "black",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Label sx={{ fontSize: 16, flexShrink: 0 }} />
          <Box
            sx={{
              overflow: "hidden",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              component="span"
              sx={{
                display: "inline-block",
                animation: "marquee 10s linear infinite",
                "@keyframes marquee": {
                  "0%": { transform: "translateX(0%)" },
                  "100%": { transform: "translateX(-50%)" },
                },
                "&:hover": {
                  animationPlayState: "paused",
                },
              }}
            >
              {loading ? "..." : `${materialDescription || "No encontrado"} - ${request.sapMaterial}    •    ${materialDescription || "No encontrado"} - ${request.sapMaterial}`}
            </Typography>
          </Box>
        </Box>

        {/* Storage Groups - Location / Type / Bins */}
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {loading ? (
            <Box sx={{ bgcolor: "#e8f5e9", p: 1, borderRadius: 1 }}>
              <Typography variant="body1" color="text.secondary">...</Typography>
            </Box>
          ) : storageGroups.length > 0 ? (
            storageGroups.map((group, groupIndex) => (
              <Box
                key={groupIndex}
                sx={{
                  bgcolor: "#e8f5e9",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                {/* Storage Location & Type Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Place sx={{ fontSize: 18, color: "success.main" }} />
                  <Typography variant="body2" fontWeight="bold" color="success.dark">
                    {group.location} / {group.type}
                  </Typography>
                </Box>
                {/* Bins */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, pl: 3 }}>
                  {group.bins.map((item, index) => (
                    <Chip
                      key={index}
                      label={`${item.bin}: ${item.quantity}`}
                      size="small"
                      color="success"
                      sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
                    />
                  ))}
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ bgcolor: "#e8f5e9", p: 1, borderRadius: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              <Place sx={{ fontSize: 20, color: "text.secondary" }} />
              <Typography variant="body1" color="text.secondary">Sin ubicaciones</Typography>
            </Box>
          )}
        </Box>

        {/* Quantity and Timer Row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Cantidad: {request.quantity}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Timer sx={{ fontSize: 16, color: getTimerColor() }} />
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: getTimerColor(), fontFamily: "monospace" }}
            >
              {elapsed}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
