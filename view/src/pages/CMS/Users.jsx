import React, { useState } from "react";
import { renderToString } from "react-dom/server";
import { useEffect } from "react";

import $ from "jquery";
import DataTable from "datatables.net-dt";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";

import {
  faPencil,
  faSave,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faEdit } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useGlobalState } from "../../components/GlobalStateContext";
import { useEdit } from "../../components/cmsEdit";

import "datatables.net";

import "datatables.net-dt/css/dataTables.dataTables.min.css";
import { useSwal } from "../../components/SweetAlert";

function AddUser() {
  const { notification } = useSwal();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("writer");
  const handleSubmit = async (event) => {
    event.preventDefault();

    const newUser = {
      username: username,
      email: email,
      role: role,
    };

    fetch("/api/cms/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          notification("success", "User added successfully!");
          setUsername("");
          setEmail("");
          setRole("writter");

          $("#username").val("");
          $("#email").val("");

          fetchUsers();
        } else {
          notification("error", "Failed to add user!");
        }
      })
      .catch((error) => {
        console.error("Error adding user:", error);
      });
  };
  return (
    <Form
      className="bg-dark rounded-3 p-3 d-flex justify-content-start text-start mb-4"
      onSubmit={handleSubmit}
    >
      <Container className="w-100 w-md-100 w-lg-75 m-auto m-md-0">
        <Row>
          <Col>
            <Form.Group
              as={Row}
              className="mb-3"
              controlId="formPlaintextEmail"
            >
              <Form.Label column sm="3" md="4" lg="3">
                Username
              </Form.Label>
              <Col sm="9" md="8" lg="9">
                <Form.Control
                  className="bg-black border-0 text-light"
                  name="username"
                  id="username"
                  placeholder="username"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </Col>
            </Form.Group>

            <Form.Group
              as={Row}
              className="mb-3"
              controlId="formPlaintextPassword"
            >
              <Form.Label column sm="3" md="4" lg="3">
                Email
              </Form.Label>
              <Col sm="9" md="8" lg="9">
                <Form.Control
                  placeholder="email"
                  name="email"
                  id="email"
                  className="bg-black border-0 text-light"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Col>
            </Form.Group>
            <Form.Group
              as={Row}
              className="mb-3"
              controlId="formPlaintextPassword"
            >
              <Form.Label column sm="3" md="4" lg="3">
                Role
              </Form.Label>
              <Col sm="9" md="8" lg="9">
                {/* select */}
                <Form.Select
                  className="bg-black border-0 text-light"
                  name="role"
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="writer">Writer</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Col>
            </Form.Group>
          </Col>
        </Row>
        <Button
          className="rounded-3 mt-4 mt-sm-0 w-sm-100"
          variant="primary"
          type="submit"
        >
          Submit
        </Button>
      </Container>
    </Form>
  );
}

function UserTable() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [tableInitialized, setTableInitialized] = useState(false);
  const { cancelEdit, edit, last_edit } = useEdit();
  const { notification } = useSwal();

  const handleEditRole = async (id, role) => {
    try {
      const response = await fetch(`/api/cms/users/role/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: role }),
      });
      const data = await response.json();
      if (data.success) {
        notification("success", "Role updated successfully!");
        $(`#spanrole-${id}`).text(role);

        $(`#role-${id}`).removeClass("bg-primary bg-danger");
        $(`#role-${id}`).addClass(
          `bg-${role === "admin" ? "danger" : "primary"}`
        );
      } else {
        notification("error", "Failed to update role!");
      }
    } catch (error) {
      // console.error("Error updating role:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`/api/cms/users/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        $(`#${id}`).css("text-decoration", "line-through");
        $(`#editBtn${id}`).addClass("d-none");
        $(`#deleteBtn${id}`).addClass("d-none");

        notification("success", "User deleted successfully!");
      } else {
        notification("error", "Failed to delete user!");
      }
    } catch (error) {}
  };

  const fetchUsers = async (page = 1) => {
    try {
      const limit = 10;
      const offset = (page - 1) * limit;
      const response = await fetch(
        `/api/cms/users?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!tableInitialized && users.length > 0) {
      // new DataTable("#actors", {
      const table = $("#actors").DataTable({
        columnDefs: [
          { width: "60px", targets: 0 },
          { width: "60px", targets: 3 },
          { width: "330px", targets: 4 },
        ],
        scrollY: "45vh",
        data: users,
        columns: [
          {
            render: function (data, type, row, meta) {
              // return `<span>${meta.row + 1}</span>`;
              // times pages
              return `<span>${
                meta.row + 1 + meta.settings._iDisplayStart
              }</span>`;
            },
          },
          {
            data: "username",
            render: function (data) {
              return `<span name="username">${data}</span>`;
            },
          },
          {
            data: "email",
            render: function (data) {
              return `<span name="email">${data}</span>`;
            },
          },
          {
            data: "role",
            render: function (data, type, row) {
              const id = row.id;
              var type = "primary";
              if (data === "admin") {
                type = "danger";
              }
              return renderToString(
                <Button
                  name="undefined"
                  className={`border-0 badge bg-${type}`}
                  id={`role-${id}`}
                >
                  <span id={`spanrole-${id}`}>{data}</span>{" "}
                  <FontAwesomeIcon icon={faPencil} />
                </Button>
              );
            },
          },
          {
            render: function (data, type, row) {
              const no = row.id;
              return renderToString(
                <center>
                  <a href="#" className="me-2 link">
                    Send first email
                  </a>
                  |
                  <Button
                    variant="primary"
                    className="ms-2 me-2"
                    id={`editBtn${no}`}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button
                    variant="success"
                    className="ms-2 me-2 d-none"
                    id={`editSaveBtn${no}`}
                    form="editForm"
                    type="submit"
                  >
                    <FontAwesomeIcon icon={faSave} />
                  </Button>
                  |
                  <Button
                    variant="danger"
                    className="ms-2"
                    id={`deleteBtn${no}`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                  <Button
                    variant="danger"
                    className="ms-2 d-none"
                    id={`cancelBtn${no}`}
                    onClick={() => cancelEdit(no)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </center>
              );
            },
          },
        ],
        destroy: true,
        paging: true,
        searching: true,
        ordering: true,
        serverSide: true,
        processing: true,
        ajax: {
          url: "/api/cms/users",
          type: "GET",
          data: function (d) {
            const limit = d.length;
            const offset = d.start;
            const searchValue = d.search.value;
            const orderColumn = d.order[0].column;
            const orderDir = d.order[0].dir;

            return {
              limit: limit,
              offset: offset,
              search: searchValue,
              page: offset / limit + 1,
              order: orderColumn,
              dir: orderDir,
            };
          },
          dataSrc: function (json) {
            return json.users;
          },
        },
        drawCallback: function () {
          const table = $("#actors").DataTable();
          table.rows().every(function (rowIdx, tableLoop, rowLoop) {
            const row = this.node();
            row.id = table.row(row).data().id;

            const editBtn = document.getElementById(`editBtn${row.id}`);
            editBtn.onclick = () => {
              edit(row.id);
            };

            const CancelBtn = document.getElementById(`cancelBtn${row.id}`);
            CancelBtn.onclick = () => {
              cancelEdit(row.id);
            };

            const deleteBtn = document.getElementById(`deleteBtn${row.id}`);
            deleteBtn.onclick = () => {
              handleDeleteUser(row.id);
            };

            const roleBtn = document.getElementById(`role-${row.id}`);
            roleBtn.onclick = () => {
              const role = roleBtn.innerText.split(" ")[0];
              const newRole = role === "admin" ? "writer" : "admin";
              handleEditRole(row.id, newRole);
            };

            const tds = row.getElementsByTagName("td");
            for (let i = 1; i < tds.length - 1; i++) {
              const td = tds[i];
              const innerElement = td.firstChild;
              const name = innerElement.getAttribute("name");
              td.setAttribute("name", name);
            }
          });
        },
      });
      setTableInitialized(true);
    } else if (tableInitialized) {
      const table = $("#actors").DataTable();
      table.clear();
      table.rows.add(users);
      table.draw();
    }
  }, [users, tableInitialized]);

  const handleEdit = async () => {
    const form = document.getElementById("editForm");
    const formData = new FormData(form);
    const id = formData.get("id");
    const username = formData.get("username");
    const email = formData.get("email");

    const user = {
      username: username,
      email: email,
    };

    try {
      const response = await fetch(`/api/cms/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const data = await response.json();
      if (data.success) {
        notification("success", "User updated successfully!");
        // fetchUsers();
        $(`#cancelBtn${id}`).click();

        const tr = document.getElementById(id);
        const tds = tr.getElementsByTagName("td");

        for (let i = 1; i < tds.length - 1; i++) {
          try {
            const td = tds[i];
            const name = td.getAttribute("name");
            if (name === "username") {
              td.innerText = username;
            } else if (name === "email") {
              td.innerText = email;
            }
          } catch (e) {
            console.log(e);
          }
        }
      } else {
        notification("error", "Failed to update user!");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <>
      <form
        id="editForm"
        onSubmit={(event) => {
          event.preventDefault();
          handleEdit();
        }}
      ></form>
      <Table responsive striped hover variant="dark" id="actors">
        <thead>
          <tr>
            <th className="text-center">#</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
      </Table>
    </>
  );
}

const Users = () => {
  const { setShowSidebar, setActiveMenu, setShowNavigation, setShowFooter } =
    useGlobalState();
  useEffect(() => {
    setShowSidebar(true);
    setActiveMenu("Users");
    setShowNavigation(false);
    setShowFooter(false);
  }, [setShowSidebar]);
  return (
    <center className="w-100">
      <div className="inner-container w-sm-100 w-xl-90 ps-3 pe-3 ps-lg-0 pe-lg-0 mt-4 mb-4">
        <AddUser />
        <UserTable />
      </div>
    </center>
  );
};

export default Users;