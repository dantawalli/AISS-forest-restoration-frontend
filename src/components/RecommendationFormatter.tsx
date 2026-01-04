import React from 'react';
import { Clock, DollarSign, Users, TrendingDown, Target, CheckCircle } from 'lucide-react';

interface RecommendationFormatterProps {
  text: {
    Objective: string;
    "Specific Actions": string[];
    "Implementation Timeframe": string;
    "Required Resources": string[];
    "Expected Measurable Impact": string;
    "Supporting Evidence from Data": string;
  };
  recommendationNumber: number;
}

const RecommendationFormatter: React.FC<RecommendationFormatterProps> = ({ 
  text, 
  recommendationNumber 
}) => {
  const formatActions = (actions: string[]) => {
    return actions.map((action, index) => action.trim().replace(/\.$$/, ''));
  };

  const formatResources = (resources: string[]) => {
    return resources.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Objective Section */}
      {text.Objective && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Objective</h4>
          </div>
          <p className="text-gray-800 leading-relaxed">{text.Objective}</p>
        </div>
      )}

      {/* Actions Section */}
      {text["Specific Actions"] && text["Specific Actions"].length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Specific Actions</h4>
          </div>
          <ul className="space-y-3">
            {formatActions(text["Specific Actions"]).map((action, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-green-700">{index + 1}</span>
                </div>
                <span className="text-gray-700 leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Implementation Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timeframe */}
        {text["Implementation Timeframe"] && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <h5 className="font-medium text-gray-900 text-sm">Timeframe</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{text["Implementation Timeframe"]}</p>
          </div>
        )}

        {/* Resources */}
        {text["Required Resources"] && text["Required Resources"].length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <h5 className="font-medium text-gray-900 text-sm">Resources</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{formatResources(text["Required Resources"])}</p>
          </div>
        )}

        {/* Impact */}
        {text["Expected Measurable Impact"] && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <h5 className="font-medium text-gray-900 text-sm">Expected Impact</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{text["Expected Measurable Impact"]}</p>
          </div>
        )}
      </div>

      {/* Supporting Evidence */}
      {text["Supporting Evidence from Data"] && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">Supporting Evidence</h4>
          </div>
          <p className="text-gray-800 leading-relaxed">{text["Supporting Evidence from Data"]}</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationFormatter;
