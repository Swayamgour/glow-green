import React from "react";
import "./PriceTable.css";

const data = [
    { code: "GGFL 10 DFL (S)", watt: "10W", length: 110, breadth: 90, height: 25, weight: 0.18, surge: "4KV / 400V", price: 135 },
    { code: "GGFL 20 DFL (S)", watt: "20W", length: 125, breadth: 100, height: 25, weight: 0.2, surge: "4KV / 400V", price: 165 },
    { code: "GGFL 50 DFL (S)", watt: "50W", length: 175, breadth: 140, height: 25, weight: 0.345, surge: "6KV / 440V", price: 290 },
    { code: "GGFL 100 DFL (S)", watt: "100W", length: 240, breadth: 190, height: 25, weight: 0.6, surge: "6KV / 440V", price: 485 },
    { code: "GGFL 150 DFL (S)", watt: "150W", length: 300, breadth: 225, height: 27, weight: 0.9, surge: "6KV / 440V", price: 725 },
];

export default function QuotationPdfs() {
    return (
        <div className="price-container">
            {/* HEADER */}
            <div className="main-header">
                PRICE LIST OF GLOW GREEN LED PRODUCTS
            </div>

            {/* SUB HEADER */}
            <div className="sub-header">
                FLOOD LIGHT DOB SERIES (S)
            </div>

            {/* TABLE */}
            <table className="price-table">
                <thead>
                    <tr>
                        <th>Picture</th>
                        <th>Product Code</th>
                        <th>Series</th>
                        <th>Wattage</th>
                        <th>Length (mm)</th>
                        <th>Breadth (mm)</th>
                        <th>Height (mm)</th>
                        <th>Weight (Kg)</th>
                        <th>Surge</th>
                        <th>OEM PRICE</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((item, i) => (
                        <tr key={i}>
                            {i === 0 && (
                                <td rowSpan={data.length} className="img-cell">
                                    <img
                                        src="https://via.placeholder.com/120"
                                        alt="product"
                                    />
                                </td>
                            )}
                            <td>{item.code}</td>
                            <td>DFL (S) Series</td>
                            <td>{item.watt}</td>
                            <td>{item.length}</td>
                            <td>{item.breadth}</td>
                            <td>{item.height}</td>
                            <td>{item.weight}</td>
                            <td>{item.surge}</td>
                            <td className="price">{item.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}