"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { Timer, Inventory, LocationOn } from "@mui/icons-material";

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

// Get current time in GMT-6
const getGMT6Time = () => {
  const now = new Date();
  // Get UTC time and subtract 6 hours for GMT-6
  const gmt6Offset = -6 * 60; // GMT-6 in minutes
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return utcTime + gmt6Offset * 60000;
};

// Parse request time assuming it's stored in GMT-6
const parseRequestTimeGMT6 = (requestTime: string) => {
  const date = new Date(requestTime);
  // If the date string doesn't include timezone info, treat it as GMT-6
  // Otherwise, convert to GMT-6
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  const gmt6Offset = -6 * 60;
  return utcTime + gmt6Offset * 60000;
};

export default function MaterialRequestCard({ request }: MaterialRequestCardProps) {
  const [elapsed, setElapsed] = useState("");
  const [diffMinutes, setDiffMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const nowGMT6 = getGMT6Time();
      const requestGMT6 = parseRequestTimeGMT6(request.requestTime);
      const diff = nowGMT6 - requestGMT6;

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

        {/* SAP Material */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          <Inventory sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="body2" fontWeight="medium">
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
