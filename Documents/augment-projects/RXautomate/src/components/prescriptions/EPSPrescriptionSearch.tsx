'use client';

import { useState } from 'react';
import { PrescriptionStatus } from '@/services/EPSService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';

export interface SearchParams {
  searchTerm?: string;
  status?: PrescriptionStatus | PrescriptionStatus[];
  dateWrittenFrom?: Date | null;
  dateWrittenTo?: Date | null;
  medicationName?: string;
  patientName?: string;
  nhsNumber?: string;
  sort?: string;
  limit?: number;
}

interface EPSPrescriptionSearchProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export default function EPSPrescriptionSearch({ onSearch, isLoading = false }: EPSPrescriptionSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchTerm: '',
    status: undefined,
    dateWrittenFrom: null,
    dateWrittenTo: null,
    medicationName: '',
    patientName: '',
    nhsNumber: '',
    sort: 'dateWritten:desc',
    limit: 50
  });
  
  const [advancedMode, setAdvancedMode] = useState(false);

  const handleInputChange = (field: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    onSearch(searchParams);
  };

  const handleReset = () => {
    setSearchParams({
      searchTerm: '',
      status: undefined,
      dateWrittenFrom: null,
      dateWrittenTo: null,
      medicationName: '',
      patientName: '',
      nhsNumber: '',
      sort: 'dateWritten:desc',
      limit: 50
    });
    onSearch({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Search Prescriptions</CardTitle>
          <Button 
            variant="ghost" 
            onClick={() => setAdvancedMode(!advancedMode)}
          >
            {advancedMode ? 'Simple Search' : 'Advanced Search'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!advancedMode ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by prescription ID, patient name, or medication..."
                value={searchParams.searchTerm || ''}
                onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                <span className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient name"
                  value={searchParams.patientName || ''}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nhsNumber">NHS Number</Label>
                <Input
                  id="nhsNumber"
                  placeholder="Enter NHS number"
                  value={searchParams.nhsNumber || ''}
                  onChange={(e) => handleInputChange('nhsNumber', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicationName">Medication</Label>
                <Input
                  id="medicationName"
                  placeholder="Enter medication name"
                  value={searchParams.medicationName || ''}
                  onChange={(e) => handleInputChange('medicationName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={searchParams.status as string || ''}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="entered-in-error">Entered in Error</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchParams.dateWrittenFrom ? (
                        format(searchParams.dateWrittenFrom, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchParams.dateWrittenFrom || undefined}
                      onSelect={(date) => handleInputChange('dateWrittenFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchParams.dateWrittenTo ? (
                        format(searchParams.dateWrittenTo, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchParams.dateWrittenTo || undefined}
                      onSelect={(date) => handleInputChange('dateWrittenTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select
                  value={searchParams.sort || 'dateWritten:desc'}
                  onValueChange={(value) => handleInputChange('sort', value)}
                >
                  <SelectTrigger id="sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateWritten:desc">Date (Newest First)</SelectItem>
                    <SelectItem value="dateWritten:asc">Date (Oldest First)</SelectItem>
                    <SelectItem value="status:asc">Status (A-Z)</SelectItem>
                    <SelectItem value="status:desc">Status (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limit">Results Limit</Label>
                <Select
                  value={searchParams.limit?.toString() || '50'}
                  onValueChange={(value) => handleInputChange('limit', parseInt(value))}
                >
                  <SelectTrigger id="limit">
                    <SelectValue placeholder="Limit results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="25">25 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
