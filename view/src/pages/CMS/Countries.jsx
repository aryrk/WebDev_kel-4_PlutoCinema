import React, { useEffect } from "react";
import $ from "jquery";
import DataTable from "datatables.net-dt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "../pagesStyle/Countries.css";
import { Container } from "react-bootstrap";

// Langkah 1: Pisahkan data ke dalam array
const countriesData = [
  { id: 1, name: "Indonesia" },
  { id: 2, name: "Korea" },
  { id: 3, name: "Jepang" },
  { id: 4, name: "Thailand" },
  { id: 5, name: "Inggris" },
  { id: 6, name: "Amerika" },
  { id: 7, name: "Spanyol" },
  { id: 8, name: "India" },
  { id: 9, name: "Perancis" },
  { id: 10, name: "Rusia" },
  { id: 11, name: "Italia" },
  // Tambahkan data lainnya di sini
];

function CMSCountries() {
  useEffect(() => {
    // Initialize DataTable
    $("#countries").DataTable({
      pageLength: 10, // Jumlah baris per halaman
      lengthChange: true, // Izinkan opsi untuk mengubah jumlah baris per halaman
      searching: true, // Aktifkan pencarian
      ordering: true, // Aktifkan pengurutan kolom
      info: true, // Tampilkan info tentang tabel
      paging: true, // Aktifkan pagination
      lengthMenu: [10, 25, 50],
      autoWidth: false,
    });

    return () => {
      // Cleanup DataTable saat komponen di-unmount
      $("#countries").DataTable().destroy();
    };
  }, []);

  return (
    <Container className="tabel">
      <h1 className="text-center">Countries</h1>
      <div className="table-responsive">
        <table id="countries" className="display">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {countriesData.map((country) => (
              <tr key={country.id}>
                <td>{country.id}</td>
                <td>{country.name}</td>
                <td>
                  <div className="actions">
                    <FontAwesomeIcon icon={faEdit} className="edit" />
                    <FontAwesomeIcon icon={faTrash} className="delete" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}

export default CMSCountries;