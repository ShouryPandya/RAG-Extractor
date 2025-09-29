import React from 'react';

// This regex finds URLs (http, https) in a string.
const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

export const ClickableText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) {
        return null;
    }

    // Split the text by the URL regex. The URLs will also be included in the resulting array.
    const parts = text.split(urlRegex);

    return (
        <>
            {parts.map((part, index) => {
                // Check if the current part is a URL
                if (part && part.match(urlRegex)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:underline"
                        >
                            {part}
                        </a>
                    );
                }
                // Otherwise, it's a regular text segment
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </>
    );
};
