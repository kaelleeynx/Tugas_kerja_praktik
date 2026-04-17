<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PriceList;

class PriceListSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            // Besi
            ['product_id' => 'BS001', 'category' => 'Besi', 'product_name' => '6 TR SNI X 12 Meter', 'unit' => '5,1', 'price' => 26500],
            ['product_id' => 'BS003', 'category' => 'Besi', 'product_name' => '6 KHS SNI /8 BC X 12 Meter', 'unit' => '6,0', 'price' => 35000],
            ['product_id' => 'BS004', 'category' => 'Besi', 'product_name' => '8 TJ SNI X 12 Meter', 'unit' => '7,3', 'price' => 47000],
            ['product_id' => 'BS005', 'category' => 'Besi', 'product_name' => '8 WBL SNI X 12 Meter', 'unit' => '7,8', 'price' => 52000],
            ['product_id' => 'BS006', 'category' => 'Besi', 'product_name' => '10 TJ SNI X 12 Meter', 'unit' => '9,4', 'price' => 68000],
            ['product_id' => 'BS007', 'category' => 'Besi', 'product_name' => '10 WBL/LTS SNI X 12 Meter', 'unit' => '9,8', 'price' => 79000],
            ['product_id' => 'BS008', 'category' => 'Besi', 'product_name' => '12 TJ SNI X 12 Meter', 'unit' => '11,5', 'price' => 98000],
            ['product_id' => 'BS009', 'category' => 'Besi', 'product_name' => '12 WBL SNI X 12 Meter', 'unit' => '11,7', 'price' => 105000],
            ['product_id' => 'BS010', 'category' => 'Besi', 'product_name' => '12 KSG SNI X 12 Meter', 'unit' => '11,8', 'price' => 110000],
            ['product_id' => 'BS011', 'category' => 'Besi', 'product_name' => '10 Ulir TJ SNI X 12 Meter', 'unit' => '9,5', 'price' => 69000],
            ['product_id' => 'BS012', 'category' => 'Besi', 'product_name' => '10 Ulir LTS SNI X 12 Meter', 'unit' => '9,7', 'price' => 80000],
            ['product_id' => 'BS013', 'category' => 'Besi', 'product_name' => '10 Ulir KS X 12 Meter', 'unit' => '9,8', 'price' => 85000],
            ['product_id' => 'BS014', 'category' => 'Besi', 'product_name' => '13 Ulir TJ SNI X 12 Meter', 'unit' => '12,6', 'price' => 115000],
            ['product_id' => 'BS015', 'category' => 'Besi', 'product_name' => '13 Ulir WBL SNI X 12 Meter', 'unit' => '12,7', 'price' => 127000],
            ['product_id' => 'BS016', 'category' => 'Besi', 'product_name' => '13 Ulir KS SNI X 12 Meter', 'unit' => '12,8', 'price' => 132000],
            ['product_id' => 'BS017', 'category' => 'Besi', 'product_name' => '16 Ulir TJ SNI X 12 Meter', 'unit' => '15,5', 'price' => 175000],
            ['product_id' => 'BS018', 'category' => 'Besi', 'product_name' => '16 Ulir WBL SNI X 12 Meter', 'unit' => '15,8', 'price' => 192000],
            ['product_id' => 'BS019', 'category' => 'Besi', 'product_name' => '16 Ulir HIJ/KS SNI X 12 Meter', 'unit' => '15,9', 'price' => 198000],

            // Wiremesh Dan Bondek
            ['product_id' => 'WM001', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Bondek 0,75 X 4 120rb/M', 'unit' => 'Lbr', 'price' => 480000],
            ['product_id' => 'WM002', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Bondek 0,75 X 5 120rb/M', 'unit' => 'Lbr', 'price' => 600000],
            ['product_id' => 'WM003', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Bondek 0,75 X 6 120rb/M', 'unit' => 'Lbr', 'price' => 720000],
            ['product_id' => 'WM004', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Wiremesh (M8) 2,10 X 5,40', 'unit' => 'Lbr', 'price' => 645000],
            ['product_id' => 'WM005', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Wiremesh (M10) 2,10 X 5,40', 'unit' => 'Lbr', 'price' => 915000],
            ['product_id' => 'WM006', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Baja Ringan 0,75', 'unit' => 'Btg', 'price' => 90000],
            ['product_id' => 'WM007', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Reng 0,45', 'unit' => 'Btg', 'price' => 48000],
            ['product_id' => 'WM008', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Holo Gypsum 20x40x0,3', 'unit' => 'Btg', 'price' => 22000],
            ['product_id' => 'WM009', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Holo Gypsum 40x40x0,3', 'unit' => 'Btg', 'price' => 26000],
            ['product_id' => 'WM010', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Holo Gypsum 20x40x0,4', 'unit' => 'Btg', 'price' => 33500],
            ['product_id' => 'WM011', 'category' => 'Wiremesh Dan Bondek', 'product_name' => 'Holo Gypsum 40x40x0,4', 'unit' => 'Btg', 'price' => 41500],

            // Atap PVC ROOFTOP
            ['product_id' => 'AP001', 'category' => 'Atap PVC', 'product_name' => 'Alderon x 4 mtr 175rb/m', 'unit' => 'Lbr', 'price' => 700000],
            ['product_id' => 'AP002', 'category' => 'Atap PVC', 'product_name' => 'Alderon x 5 mtr 175rb/m', 'unit' => 'Lbr', 'price' => 875000],
            ['product_id' => 'AP003', 'category' => 'Atap PVC', 'product_name' => 'Alderon x 6 mtr 175rb/m', 'unit' => 'Lbr', 'price' => 1050000],
            ['product_id' => 'AP004', 'category' => 'Atap PVC', 'product_name' => 'Sun protech x 4 mtr 150rb/m', 'unit' => 'Lbr', 'price' => 600000],
            ['product_id' => 'AP005', 'category' => 'Atap PVC', 'product_name' => 'Sun protech x 5 mtr 150rb/m', 'unit' => 'Lbr', 'price' => 750000],
            ['product_id' => 'AP006', 'category' => 'Atap PVC', 'product_name' => 'Sun protech x 6 mtr 150rb/m', 'unit' => 'Lbr', 'price' => 900000],
            ['product_id' => 'AP007', 'category' => 'Atap PVC', 'product_name' => 'Paku alderon 1 pax isi 20 sheet', 'unit' => 'Pax', 'price' => 110000],

            // Pondasi Cakar Ayam (sebagian sampel utama)
            ['product_id' => 'PC001', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '6 KHS Sni 40 X 40 - Kotak Pinggir', 'unit' => 'Pcs', 'price' => 47000],
            ['product_id' => 'PC002', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '6 KHS Sni 40 X 40 - Kotak Tahu', 'unit' => 'Pcs', 'price' => 55000],
            ['product_id' => 'PC003', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '6 KHS Sni 40 X 40 - Stek 4 Stap', 'unit' => 'Pcs', 'price' => 62000],
            ['product_id' => 'PC004', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '6 KHS Sni 40 X 40 - Stek 6 Stap', 'unit' => 'Pcs', 'price' => 72000],
            ['product_id' => 'PC005', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '8 TJ Sni 40 X 40 - Kotak Pinggir', 'unit' => 'Pcs', 'price' => 67000],
            ['product_id' => 'PC006', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '8 TJ Sni 40 X 40 - Kotak Tahu', 'unit' => 'Pcs', 'price' => 75000],
            ['product_id' => 'PC007', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '8 TJ Sni 40 X 40 - Stek 4 Stap', 'unit' => 'Pcs', 'price' => 85000],
            ['product_id' => 'PC008', 'category' => 'Pondasi Cakar Ayam', 'product_name' => '8 TJ Sni 40 X 40 - Stek 6 Stap', 'unit' => 'Pcs', 'price' => 100000],
        ];

        foreach ($data as $item) {
            PriceList::updateOrCreate(
                ['product_id' => $item['product_id']],
                $item
            );
        }
    }
}
