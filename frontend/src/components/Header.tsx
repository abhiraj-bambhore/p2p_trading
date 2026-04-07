'use client';
import React from 'react';
import { Sun, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
    connected: boolean;
    tick: number;
    onTriggerCloud: () => void;
    onReset: () => void;
}

// Kept for backwards-compatibility but currently unused
// Navigation is handled by the Sidebar component
export default function Header({ connected, tick, onTriggerCloud, onReset }: HeaderProps) {
    return null; // Sidebar replaces this
}
