import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar as CalendarIcon, MapPin } from "lucide-react"

const scheduleData = [
  { id: 1, course: "CS-101", title: "Intro to Programming", day: "Monday / Wednesday", time: "09:00 AM - 10:30 AM", room: "SCI-101" },
  { id: 2, course: "CS-205", title: "Data Structures", day: "Tuesday / Thursday", time: "11:00 AM - 12:30 PM", room: "ENG-204" },
  { id: 3, course: "CS-410", title: "Artificial Intelligence", day: "Friday", time: "01:00 PM - 04:00 PM", room: "SCI-305" }
]

export default function FacultySchedule() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Schedule</h2>
          <p className="text-slate-500 mt-1">Official assigned teaching schedule for Fall 2024.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-slate-700 bg-white shadow-sm border-slate-200">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button variant="outline" className="text-slate-700 bg-white shadow-sm border-slate-200">
            <CalendarIcon className="w-4 h-4 mr-2" /> Sync to ICS
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {scheduleData.map(item => (
          <Card key={item.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded text-sm">{item.course}</span>
                  <h3 className="font-semibold text-lg text-slate-900">{item.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> {item.day}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Room {item.room}</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-center min-w-[180px]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time</p>
                <p className="text-slate-900 font-medium">{item.time}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
