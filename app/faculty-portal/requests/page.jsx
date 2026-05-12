import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquarePlus, Clock, CheckCircle2 } from "lucide-react"

export default function FacultyRequests() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Requests / Messages</h2>
          <p className="text-slate-500 mt-1">Submit tickets for schedule changes and track administrative responses.</p>
        </div>
        <Button className="bg-[#115e59] hover:bg-teal-900 text-white">
          <MessageSquarePlus className="w-4 h-4 mr-2" /> New Ticket
        </Button>
      </div>

      <div className="space-y-4 mt-8">
        {/* Ticket 1 */}
        <Card className="border border-slate-200">
          <CardContent className="p-5 flex gap-4">
            <div className="mt-1"><Clock className="text-orange-500 w-5 h-5" /></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900">Room Change Request: CS-101</h3>
                <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">Pending Review</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                "The projector in SCI-101 is consistently failing. Is it possible to move CS-101 to SCI-102 starting next week?"
              </p>
              <p className="text-xs text-slate-400 mt-3">Submitted 2 days ago</p>
            </div>
          </CardContent>
        </Card>

        {/* Ticket 2 */}
        <Card className="border border-slate-200 bg-slate-50/50">
          <CardContent className="p-5 flex gap-4 opacity-75">
            <div className="mt-1"><CheckCircle2 className="text-green-600 w-5 h-5" /></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900">Emergency Time Block - Oct 12</h3>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">Resolved</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                "I will be attending a conference on Oct 12 and will need coverage for my morning sections."
              </p>
              <div className="bg-white border border-slate-200 p-3 mt-3 rounded-md">
                <p className="text-xs font-semibold text-teal-700 mb-1">Admin Response:</p>
                <p className="text-sm text-slate-600">"Approved. Dr. Smith will cover your 9AM and 11AM sections."</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
