import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock, CheckCircle2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FacultyDashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Welcome Back, Dr. Faculty</h2>
        <p className="text-slate-500 mt-1">Here is your current academic overview for Fall 2024.</p>
      </div>

      <Alert className="bg-orange-50 border-orange-200 text-orange-800">
        <AlertCircle className="h-5 w-5 !text-orange-600" />
        <AlertTitle className="text-orange-900 font-semibold">Action Required</AlertTitle>
        <AlertDescription className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span>You have not yet submitted your availability for the upcoming Spring 2025 semester. Deadline is Oct 15.</span>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
            Submit Availability
          </Button>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Teaching Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-teal-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">15</span>
                <span className="text-slate-500 ml-2 font-medium">Hours / Week</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Maximum allowed is 18 hours.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">4</span>
                <span className="text-slate-500 ml-2 font-medium">Sections</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Across 2 different campuses.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Schedule Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <span className="text-2xl font-bold text-slate-900">Published</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Fall 2024 schedule is finalized.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
