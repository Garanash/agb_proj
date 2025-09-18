'use client'

import React, { useState } from 'react'
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface VideoDemoProps {
  title: string
  description: string
  videoSrc: string
  posterSrc?: string
  duration?: string
  steps?: string[]
  className?: string
}

export default function VideoDemo({
  title,
  description,
  videoSrc,
  posterSrc,
  duration,
  steps,
  className = ""
}: VideoDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const handlePlayPause = () => {
    const video = document.getElementById(`video-${title.replace(/\s+/g, '-')}`) as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        video.play()
        setIsPlaying(true)
      }
    }
  }

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setCurrentTime(video.currentTime)
  }

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setDuration(video.duration)
    setIsLoading(false)
  }

  const handleLoadStart = () => {
    setIsLoading(true)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        {duration && (
          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>Длительность: {duration}</span>
          </div>
        )}
      </div>

      {/* Видео контейнер */}
      <div className="relative bg-black">
        <video
          id={`video-${title.replace(/\s+/g, '-')}`}
          className="w-full h-auto"
          poster={posterSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadStart={handleLoadStart}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
          Ваш браузер не поддерживает видео.
        </video>

        {/* Загрузка */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex items-center space-x-2 text-white">
              <ArrowPathIcon className="h-6 w-6 animate-spin" />
              <span>Загрузка...</span>
            </div>
          </div>
        )}

        {/* Кнопка воспроизведения */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110"
          >
            {isPlaying ? (
              <PauseIcon className="h-8 w-8" />
            ) : (
              <PlayIcon className="h-8 w-8 ml-1" />
            )}
          </button>
        </div>

        {/* Прогресс бар */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
          <div className="flex items-center space-x-3 text-white text-sm">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Шаги демонстрации */}
      {steps && steps.length > 0 && (
        <div className="p-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Что показано в демонстрации:</h4>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Импорт ClockIcon
import { ClockIcon } from '@heroicons/react/24/outline'
