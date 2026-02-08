import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17h6v-1.5H9V17zm0-4h10v-1.5H9V13zm0-4h10V7.5H9V9z" />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm0 1.5h14a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5z"
            />
            <circle cx="6" cy="9" r="1" />
            <circle cx="6" cy="13" r="1" />
            <circle cx="6" cy="17" r="1" />
        </svg>
    );
}
