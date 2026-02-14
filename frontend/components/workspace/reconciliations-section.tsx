"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Cell,
  Pie,
  PieChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const preparerData = [
  { name: "Completed", value: 75, color: "#22C55E" },
  { name: "In Progress", value: 15, color: "#3B82F6" },
  { name: "Pending", value: 10, color: "#EF4444" },
];

const reviewerData = [
  { name: "Completed", value: 70, color: "#22C55E" },
  { name: "In Progress", value: 20, color: "#3B82F6" },
  { name: "Pending", value: 10, color: "#F59E0B" },
];

const completionData = [
  { month: "Jan", target: 85, actual: 82 },
  { month: "Feb", target: 88, actual: 87 },
  { month: "Mar", target: 90, actual: 89 },
  { month: "Apr", target: 92, actual: 91 },
  { month: "May", target: 95, actual: 94 },
];

const topEntities = [
  { name: "MarketSpan", amount: "$272.78K", change: 2.3, trending: "up" },
  { name: "Amazon Inc", amount: "$6.88B", change: 1.2, trending: "down" },
  { name: "Tesla Motors", amount: "$1.23B", change: 4.1, trending: "up" },
  { name: "Apple Inc", amount: "$892.45K", change: 0.8, trending: "down" },
];

export function ReconciliationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-slate-900">Reconciliations</span>
          <Link
            href="#"
            className="text-sm font-normal text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            View Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Preparer Status</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={preparerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {preparerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Reviewer Status</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={reviewerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {reviewerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Target vs Actual Completion</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={{ stroke: "#E2E8F0" }}
                domain={[0, 100]}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#3B82F6", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Entities</h3>
          <div className="space-y-3">
            {topEntities.map((entity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <span className="text-sm font-medium text-slate-900">{entity.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-900">{entity.amount}</span>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      entity.trending === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {entity.trending === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{entity.change}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
