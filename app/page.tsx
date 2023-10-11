"use client"
import React, { FC, useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import * as d3 from 'd3';
import Image from 'next/image';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import bcpLogo from '../public/logo-bcp.png'
import { SendHorizontal } from 'lucide-react';

// Sample data: week and spending in USD
const data = [
  { week: 1, value: 30 },
  { week: 2, value: 80 },
  { week: 3, value: 45 },
  { week: 4, value: 60 },
  { week: 5, value: 120 },
  { week: 6, value: 10 },
  { week: 7, value: 20 },
  { week: 8, value: 40 },
  { week: 9, value: 80 },
  { week: 10, value: 160 },
  { week: 11, value: 100 },
  { week: 12, value: 300 },
  { week: 13, value: 70 },
  { week: 14, value: 120 },
  { week: 15, value: 120 },
  { week: 16, value: 120 },
  { week: 17, value: 120 },
  { week: 18, value: 120 }
];

interface Message {
  text: string;
  sender: 'user' | 'system';
}

const MainPage: FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current).html(""); // Clear previous SVG content

      const xScale = d3.scaleLinear()
        .domain([1, 52]) // Assuming weeks of the year
        .range([0, 300]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 0])
        .range([150, 0]);

      // Draw line
      const line = d3.line<{ week: number, value: number }>()
        .x(d => xScale(d.week))
        .y(d => yScale(d.value));

      svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('d', line);

      // Add axes
      svg.append('g')
        .attr('transform', 'translate(0,150)')
        .call(d3.axisBottom(xScale).ticks(12)) // Approx one tick per month
        .append('text')
        .attr('x', 150)
        .attr('y', 30)
        .attr('fill', '#000')
        .text('Week');

      svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('x', -75)
        .attr('y', -40)
        .attr('fill', '#000')
        .text('Amount Spent (USD)');
    }
  }, [ref, messages]); // Re-render graph when submittedText changes

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setMessages(prev => [...prev, { text: inputValue, sender: 'user' }]);
    setInputValue('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.answer, sender: 'system' }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'Error occurred. Please try again later.', sender: 'system' }]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className='flex flex-row justify-between items-center p-2 border-b-2 border-secondary'>
        <Image
          alt='logo-bcp'
          src={bcpLogo}
          height={100}
          width={100}
        />
        <ModeToggle />
      </div>

      <div className="overflow-y-auto p-2 flex-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? '' : 'justify-end'}`}
          >
            <div
              className={`
                text-sm p-1 rounded m-1 
                ${msg.sender === 'user' ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'}
                `}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-row w-full p-2 bg-secondary items-center">
        <input
          type="text"
          autoFocus
          value={inputValue}
          onChange={handleChange}
          placeholder="Escribe tu consulta aquí..."
          className="w-full p-2 border rounded-md"
        />
        <button>
          <SendHorizontal size={24} className='ml-2' />
        </button>
      </form>
    </div>
  );
};

export default MainPage;
