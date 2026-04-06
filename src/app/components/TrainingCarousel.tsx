import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, Users, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface Training {
  title: string;
  status?: string;
  date: string;
  time: string;
  location?: string;
  companies?: string[];
  participants: number;
  progress?: number;
  completed?: boolean;
}

interface TrainingCarouselProps {
  trainings: Training[];
  type: "future" | "past";
  onSlideChange?: (index: number) => void;
}

export function TrainingCarousel({ trainings, type, onSlideChange }: TrainingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 1;
  const maxIndex = Math.max(0, trainings.length - itemsPerPage);

  const nextSlide = () => {
    const newIndex = Math.min(currentIndex + 1, maxIndex);
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  };

  const prevSlide = () => {
    const newIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  };

  const currentTraining = trainings[currentIndex];

  if (!currentTraining) return null;

  return (
    <div className="relative flex flex-col h-full">
      <Card className={`flex-1 flex flex-col min-h-[280px] transition-colors ${
        type === "future" && currentIndex === 0
          ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
          : "bg-white dark:bg-card border-border"
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {currentTraining.status ? (
                  <Badge className={currentTraining.status === "Em andamento" ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}>
                    {currentTraining.status}
                  </Badge>
                ) : type === "past" && (
                  <Badge variant="secondary">Concluído</Badge>
                )}
                <Badge variant="outline" className={type === "future" ? "border-blue-400 text-blue-700 dark:text-blue-300" : ""}>
                  <Users className="w-3 h-3 mr-1" />
                  {currentTraining.participants} alunos
                </Badge>
              </div>
              <CardTitle className="text-xl text-foreground line-clamp-1">
                {currentTraining.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Calendar className="w-4 h-4" />
                {currentTraining.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Clock className="w-4 h-4" />
                {currentTraining.time}
              </div>
            </div>
            {currentTraining.location && (
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <MapPin className="w-4 h-4" />
                {currentTraining.location}
              </div>
            )}
            {currentTraining.companies && currentTraining.companies.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-foreground/80 mb-1">Empresas Participantes:</p>
                <div className="flex flex-wrap gap-1">
                  {currentTraining.companies.slice(0, 3).map((company) => (
                    <Badge key={company} variant="secondary" className="bg-white/50 dark:bg-black/20 text-xs">
                      {company}
                    </Badge>
                  ))}
                  {currentTraining.companies.length > 3 && (
                    <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-xs text-muted-foreground">
                      +{currentTraining.companies.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {type === "future" && currentTraining.progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground/80">Progresso</span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{currentTraining.progress}%</span>
              </div>
              <div className="w-full bg-white dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${currentTraining.progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      {trainings.length > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="w-8 h-8 rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Dots navigation */}
            <div className="flex gap-1.5 px-2">
              {trainings.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    onSlideChange?.(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'bg-blue-600 dark:bg-blue-400 w-4' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500'
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="w-8 h-8 rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Return to closest course */}
          {currentIndex > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setCurrentIndex(0);
                onSlideChange?.(0);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Voltar ao mais próximo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}