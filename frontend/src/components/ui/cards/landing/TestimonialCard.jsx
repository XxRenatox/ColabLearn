import React from "react";
import Avatar from "../../Avatar";
import { Star } from "lucide-react";

export const TestimonialCard = ({ testimonial, index }) => (
  <div
    key={index}
    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1"
  >
    <div className="flex items-center mb-6">
      <Avatar
        userId={testimonial.id || testimonial.email || `testimonial-${index}`}
        name={testimonial.name || "Usuario"}
        avatar={testimonial.avatar_url || null}
        avatarStyle={testimonial.avatar}
        size="xl"
        showBorder={false}
        className="mr-4"
      />
      <div>
        <div className="font-semibold text-gray-900">{testimonial.name}</div>
        <div className="text-sm text-gray-500">{testimonial.role}</div>
      </div>
    </div>
    <div className="flex mb-4">
      {[...Array(testimonial.rating)].map((_, i) => (
        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
      ))}
    </div>
    <p className="text-gray-600 italic leading-relaxed">
      "{testimonial.content}"
    </p>
  </div>
);

