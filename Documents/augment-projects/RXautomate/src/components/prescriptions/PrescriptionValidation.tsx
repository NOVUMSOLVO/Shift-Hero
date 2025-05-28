import React, { useState, useEffect } from 'react';
import { ValidationResult, ValidationSeverity, ValidationIssue } from '../../services/PrescriptionValidationService';
import { AlertTriangle, AlertOctagon, AlertCircle, CheckCircle, Info, Brain, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Progress } from '../ui/progress';

interface PrescriptionValidationProps {
  prescriptionId: string;
  onValidationComplete?: (result: ValidationResult) => void;
}

interface AiValidationIssue extends ValidationIssue {
  aiGenerated?: boolean;
  confidence?: number;
}

interface AiValidationResult extends ValidationResult {
  aiEnhanced?: boolean;
  issues: AiValidationIssue[];
  id?: string;
}

export default function PrescriptionValidation({ prescriptionId, onValidationComplete }: PrescriptionValidationProps) {
  const [validationResult, setValidationResult] = useState<AiValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const validatePrescription = async () => {
      if (!prescriptionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/prescriptions/${prescriptionId}/validate`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`Validation failed: ${response.statusText}`);
        }
        
        const result: AiValidationResult = await response.json();
        setValidationResult(result);
        
        if (onValidationComplete) {
          onValidationComplete(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error during validation');
        console.error('Error validating prescription:', err);
      } finally {
        setLoading(false);
      }
    };
    
    validatePrescription();
  }, [prescriptionId, onValidationComplete]);

  const handleFeedback = async (issueId: string, isPositive: boolean) => {
    // Store feedback locally first
    setFeedback(prev => ({
      ...prev,
      [issueId]: isPositive
    }));

    // Send feedback to the server to improve the AI model
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          isPositive,
          validationResultId: validationResult?.id,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }
      
      console.log(`Feedback sent for issue ${issueId}: ${isPositive ? 'positive' : 'negative'}`);
    } catch (err) {
      console.error('Error sending feedback:', err);
      // Don't show an error to the user, just log it
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
        <span>Validating prescription...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-700 mb-2">
          <AlertOctagon className="h-5 w-5 mr-2" />
          <h3 className="font-semibold">Validation Error</h3>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  const isAIEnhanced = validationResult.aiEnhanced === true;

  return (
    <div className="p-4 rounded-lg border" data-testid="prescription-validation">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          {validationResult.isValid ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>Prescription Validated</span>
            </>
          ) : (
            <>
              {renderSeverityIcon(validationResult.severity)}
              <span>Validation Issues Found</span>
            </>
          )}
          
          {isAIEnhanced && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 bg-purple-50 border-purple-200 text-purple-700">
                    <Brain className="h-3 w-3 mr-1" /> AI Enhanced
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">This validation was enhanced using AI analysis for better accuracy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </h3>
        <span className="text-sm text-gray-500">
          {new Date(validationResult.timestamp).toLocaleString()}
        </span>
      </div>

      {validationResult.isValid ? (
        <div className="bg-green-50 p-3 rounded-md text-green-700 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>No issues detected. Safe to dispense.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {validationResult.issues.map((issue, index) => {
            const isAIGenerated = issue.aiGenerated === true;
            const confidenceScore = isAIGenerated && issue.confidence !== undefined ? issue.confidence : null;
            const issueId = `issue-${index}`;
            
            return (
              <div 
                key={index} 
                id={issueId}
                className={`p-3 rounded-md ${getSeverityBackgroundColor(issue.severity)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    {renderSeverityIcon(issue.severity)}
                    <span className={`font-medium ${getSeverityTextColor(issue.severity)}`}>
                      {getIssueTypeLabel(issue.type)}
                    </span>
                    
                    {isAIGenerated && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="ml-2 bg-purple-50 border-purple-200 text-purple-700">
                              <Brain className="h-3 w-3 mr-1" /> AI
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">This issue was detected by AI analysis</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {isAIGenerated && (
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`p-1 ${feedback[issueId] === true ? 'bg-green-100 text-green-700' : ''}`}
                        onClick={() => handleFeedback(issueId, true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={`p-1 ${feedback[issueId] === false ? 'bg-red-100 text-red-700' : ''}`}
                        onClick={() => handleFeedback(issueId, false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <p className="text-sm ml-7">{issue.description}</p>
                
                {confidenceScore !== null && (
                  <div className="mt-2 ml-7">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-500 mr-2">AI Confidence:</span>
                      <Progress value={confidenceScore * 100} className="h-1 flex-1" />
                      <span className="text-xs text-gray-600 ml-2">{Math.round(confidenceScore * 100)}%</span>
                    </div>
                  </div>
                )}
                
                {issue.medications.length > 0 && (
                  <div className="mt-2 ml-7">
                    <span className="text-xs font-medium text-gray-500">Medications involved:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.medications.map((med, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-white rounded text-xs font-medium border"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper functions
function renderSeverityIcon(severity: ValidationSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return <AlertOctagon className="h-5 w-5 text-red-600 mr-2" />;
    case 'HIGH':
      return <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />;
    case 'MEDIUM':
      return <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />;
    case 'LOW':
      return <Info className="h-5 w-5 text-blue-500 mr-2" />;
    case 'NONE':
      return <CheckCircle className="h-5 w-5 text-green-500 mr-2" />;
    default:
      return <Info className="h-5 w-5 text-gray-500 mr-2" />;
  }
}

function getSeverityBackgroundColor(severity: ValidationSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-50';
    case 'HIGH':
      return 'bg-orange-50';
    case 'MEDIUM':
      return 'bg-amber-50';
    case 'LOW':
      return 'bg-blue-50';
    default:
      return 'bg-gray-50';
  }
}

function getSeverityTextColor(severity: ValidationSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'text-red-700';
    case 'HIGH':
      return 'text-orange-700';
    case 'MEDIUM':
      return 'text-amber-700';
    case 'LOW':
      return 'text-blue-700';
    default:
      return 'text-gray-700';
  }
}

function getIssueTypeLabel(type: string): string {
  switch (type) {
    case 'DRUG_INTERACTION':
      return 'Drug Interaction Detected';
    case 'INAPPROPRIATE_DOSAGE':
      return 'Inappropriate Dosage';
    case 'ALLERGY':
      return 'Allergy Risk';
    case 'CONTRAINDICATION':
      return 'Contraindication';
    default:
      return type.replace(/_/g, ' ');
  }
}
