"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { Timer, Inventory, LocationOn, Label } from "@mui/icons-material";

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

// Parse an ISO string that is stored with +00:00 but actually represents a GMT-6 local time.
// We ignore the provided offset and convert the naive local time to the correct UTC epoch.
const parseRequestTimeAssumingGMT6 = (requestTime: string): number => {
  const match = requestTime.match(
    /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/
  );

  if (!match) {
    // Fallback: let Date parse it, best-effort
    return new Date(requestTime).getTime();
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second,
    milli = "0",
  ] = match;

  const y = Number(year);
  const m = Number(month) - 1; // Date.UTC expects 0-based month
  const d = Number(day);
  const h = Number(hour);
  const min = Number(minute);
  const s = Number(second);
  const ms = Number(milli);

  // The stored time is intended to be GMT-6 local. Convert that local time to UTC by adding 6 hours.
  return Date.UTC(y, m, d, h + 6, min, s, ms);
};

export default function MaterialRequestCard({ request }: MaterialRequestCardProps) {
  const [elapsed, setElapsed] = useState("");
  const [diffMinutes, setDiffMinutes] = useState(0);
  const [custPart, setCustPart] = useState<string | null>(null);
  const [custPartLoading, setCustPartLoading] = useState(true);

  // Fetch customer part from MySQL
  useEffect(() => {
    const fetchCustPart = async () => {
      try {
        const response = await fetch(`/api/customer-part?sap=${request.sapMaterial}`);
        const data = await response.json();
        setCustPart(data.custPart);
      } catch (error) {
        console.error("Error fetching customer part:", error);
        setCustPart(null);
      } finally {
        setCustPartLoading(false);
      }
    };
    fetchCustPart();
  }, [request.sapMaterial]);

  useEffect(() => {
    const calculateElapsed = () => {
      // Current time in UTC (millis)
      const nowUtc = Date.now();
      // Request time interpreted as GMT-6 local, converted to UTC millis
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

  // Color based on elapsed time (green < 5min, yellow < 15min, red > 15min)
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
        {/* Station Name */}
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {request.stationName}
        </Typography>

        {/* Customer Part - Orange background */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 1,
            bgcolor: custPart ? "#ff9800" : "grey.400",
            color: "white",
            px: 1,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          <Label sx={{ fontSize: 18 }} />
          <Typography variant="body1" fontWeight="bold">
            {custPartLoading ? "..." : (custPart || "No encontrado")}
          </Typography>
        </Box>

        {/* SAP Material - Bold text only */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
          <Inventory sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="body1" fontWeight="bold">
            {request.sapMaterial}
          </Typography>
        </Box>

        {/* Area */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
          <LocationOn sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="body2" color="text.secondary">
            {request.area}
          </Typography>
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
