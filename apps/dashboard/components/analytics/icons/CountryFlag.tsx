"use client";

import "flag-icons/css/flag-icons.min.css";

type CountryFlagProps = {
	country: string;
	size?: number;
	squared?: boolean;
};

export function CountryFlag({ country, size = 18, squared = false }: CountryFlagProps) {
	const countryCode = country.toLowerCase();

	return (
		<span
			aria-label={`${country} flag`}
			className={`fi fi-${countryCode}${squared ? " fis" : ""}`}
			style={{
				fontSize: size,
				lineHeight: 1,
				borderRadius: 2,
			}}
		/>
	);
}
