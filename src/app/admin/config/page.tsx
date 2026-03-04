"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface ConfigData {
    rateLimitPerDay: number
    moderationEnabled: boolean
    aiModerationEnabled: boolean
    maintenanceMode: boolean
    keywordBlocklist: string[]
}

export default function AdminConfigPage() {
    const [config, setConfig] = React.useState<ConfigData | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [saved, setSaved] = React.useState(false)

    React.useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/admin/config")
                if (res.ok) {
                    const data = await res.json()
                    setConfig(data.data)
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        if (!config) return
        setIsSaving(true)
        setSaved(false)
        try {
            const res = await fetch("/api/admin/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rateLimitPerDay: config.rateLimitPerDay,
                    moderationEnabled: config.moderationEnabled,
                    aiModerationEnabled: config.aiModerationEnabled,
                    maintenanceMode: config.maintenanceMode,
                }),
            })
            if (res.ok) setSaved(true)
        } catch {
            // silent
        } finally {
            setIsSaving(false)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
                <p className="text-muted-foreground mt-2">Manage instance-wide settings and moderation toggles (Super Admin only).</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>Rate Limiting & Security</CardTitle>
                        <CardDescription>Control how often users can perform actions to prevent abuse.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="rate-limit">Messages Rate Limit (per user per day)</Label>
                            <Input
                                id="rate-limit"
                                type="number"
                                value={config?.rateLimitPerDay ?? 20}
                                onChange={(e) => setConfig(prev => prev ? { ...prev, rateLimitPerDay: parseInt(e.target.value) || 20 } : prev)}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="maintenance" className="text-base">Maintenance Mode</Label>
                                <span className="text-sm text-muted-foreground">Disable all message sending platform-wide.</span>
                            </div>
                            <Switch
                                id="maintenance"
                                checked={config?.maintenanceMode ?? false}
                                onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, maintenanceMode: checked } : prev)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>Moderation Pipeline</CardTitle>
                        <CardDescription>Configure content moderation settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="moderation" className="text-base">Content Moderation</Label>
                                <span className="text-sm text-muted-foreground">Enable keyword filtering and content review.</span>
                            </div>
                            <Switch
                                id="moderation"
                                checked={config?.moderationEnabled ?? true}
                                onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, moderationEnabled: checked } : prev)}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="ai-mod" className="text-base">AI Moderation</Label>
                                <span className="text-sm text-muted-foreground">Use AI to analyze messages for harmful content.</span>
                            </div>
                            <Switch
                                id="ai-mod"
                                checked={config?.aiModerationEnabled ?? false}
                                onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, aiModerationEnabled: checked } : prev)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 px-6 py-4 flex items-center justify-end gap-3">
                        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                            ) : (
                                "Save Settings"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
