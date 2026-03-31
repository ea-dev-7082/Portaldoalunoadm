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
}

export function TrainingCarousel({ trainings, type }: TrainingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 1;
  const maxIndex = Math.max(0, trainings.length - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentTraining = trainings[currentIndex];

  if (!currentTraining) return null;

  return (
    <div className="relative">
      {type === "future" && currentIndex === 0 ? (
        // Featured current training card
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500 hover:bg-green-600">
                    {currentTraining.status}
                  </Badge>
                  <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-300">
                    <Users className="w-3 h-3 mr-1" />
                    {currentTraining.participants} alunos
                  </Badge>
                </div>
                <CardTitle className="text-xl text-foreground">
                  {currentTraining.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Calendar className="w-4 h-4" />
                {currentTraining.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Clock className="w-4 h-4" />
                {currentTraining.time}
              </div>
              {currentTraining.location && (
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <MapPin className="w-4 h-4" />
                  {currentTraining.location}
                </div>
              )}
              {currentTraining.companies && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground/80 mb-2">Empresas Participantes:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTraining.companies.map((company) => (
                      <Badge key={company} variant="secondary" className="bg-white dark:bg-gray-800">
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {currentTraining.progress !== undefined && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground/80">Progresso</span>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currentTraining.progress}%</span>
                  </div>
                  <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${currentTraining.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Standard training card
        <Card className={type === "past" ? "bg-muted" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">{currentTraining.title}</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {currentTraining.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {currentTraining.time}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                <Users className="w-3 h-3 mr-1" />
                {currentTraining.participants}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      {trainings.length > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} de {trainings.length}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="gap-1"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
