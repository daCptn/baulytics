"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, Edit, Save, X, ChevronDown, ChevronUp, Trash, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { EditorSection } from "./contract-editor-with-contract"
import ReactMarkdown from 'react-markdown'

interface ContractSectionProps {
  section: EditorSection
  isActive: boolean
  onClick: () => void
  onUpdate: (updatedContent: string) => void
  onCollapsedChange?: (isCollapsed: boolean) => void
  onRemoveClause?: (sectionId: string) => void
  onOptimizeWithAI?: (sectionId: string, text?: string) => void
  onSubmitCustomFormulation?: (sectionId: string, formulation: string) => void
  onApplyAlternativeFormulation?: (sectionId: string, alternativeId: string) => void
  optimizingSectionId?: string | null
  onToggleDetails?: (sectionId: string, e: React.MouseEvent) => void
  detailsVisible?: boolean
}

export function ContractSection({ 
  section, 
  isActive, 
  onClick, 
  onUpdate, 
  onCollapsedChange,
  onRemoveClause,
  onOptimizeWithAI,
  onSubmitCustomFormulation,
  onApplyAlternativeFormulation,
  optimizingSectionId,
  onToggleDetails,
  detailsVisible
}: ContractSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(section.content)

  // Initialisiere content, wenn sich section.content ändert
  useEffect(() => {
    setContent(section.content)
  }, [section.content, section.title])

  const getRiskIcon = (risk: EditorSection["risk"]) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getRiskBorder = (risk: string, needsRenegotiation?: boolean, urgentAttention?: boolean) => {
    if (urgentAttention) {
      return "border-l-4 border-l-red-500 bg-red-50/50"
    }
    if (needsRenegotiation) {
      return "border-l-4 border-l-amber-500 bg-amber-50/50"
    }
    switch (risk) {
      case "high":
        return "border-l-4 border-l-red-500"
      case "medium":
        return "border-l-4 border-l-amber-500"
      case "low":
        return "border-l-4 border-l-green-500"
      default:
        return ""
    }
  }

  const handleSave = () => {
    onUpdate(content)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setContent(section.content)
    setIsEditing(false)
  }

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleDetails) {
      onToggleDetails(section.id, e)
    }
  }

  const getEvaluationText = (evaluation: string) => {
    if (evaluation.toLowerCase() === "rot") return "Hohes Risiko"
    if (evaluation.toLowerCase() === "gelb") return "Mittleres Risiko"
    if (evaluation.toLowerCase() === "grün") return "Niedriges Risiko"
    if (evaluation.toLowerCase() === "fehler") return "Analysefehler"
    return evaluation
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isActive ? "ring-2 ring-primary ring-offset-2" : "",
        getRiskBorder(section.risk, section.needsRenegotiation, section.urgentAttention),
        section.removed ? "opacity-70" : "",
      )}
      onClick={(e) => {
        // Verhindere unnötige Neuaktivierungen
        if (!isEditing && !isActive) {
          onClick();
        }
      }}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          {getRiskIcon(section.risk)}
          <h3 className="font-medium truncate" title={section.title}>{section.title}</h3>
          {section.removed && (
            <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-700 whitespace-nowrap">
              Entfernt
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleDetails}
            title={detailsVisible ? "Details ausblenden" : "Details anzeigen"}
          >
            {detailsVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Speichern
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
        <CardContent className="p-4 pt-2" onClick={isEditing ? (e) => e.stopPropagation() : undefined}>
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] font-normal text-sm border-primary/50 focus:border-primary focus:ring-primary/30"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
          <div className="prose prose-sm dark:prose-invert break-words" onClick={(e) => {
            e.stopPropagation();
            // Nur aktivieren, wenn die Sektion nicht schon aktiv ist
            if (!isActive) {
              onClick();
            }
            }}>
             <ReactMarkdown
               components={{
                 // Überschreibe Standard-Rendering für Tabellen und ähnliche Elemente
                 table: ({node, ...props}) => (
                   <div style={{overflowX: 'auto', width: '100%'}}>
                     <table style={{display: 'block', width: '100%'}} {...props} />
                   </div>
                 ),
                 // Stelle sicher, dass alle Elemente sich der Container-Breite anpassen
                 div: ({node, ...props}) => <div style={{display: 'block', width: '100%'}} {...props} />
               }}
             >{section.content}</ReactMarkdown>
           </div>
        )}
        
        {/* Begründung und Details wurden entfernt und werden jetzt in contract-editor-with-contract.tsx angezeigt */}
        </CardContent>
    </Card>
  )
}
