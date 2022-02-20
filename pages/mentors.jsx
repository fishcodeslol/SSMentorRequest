import { useState, useEffect } from "react";
import { connectToDatabase } from "../util/mongodb";
import Request from "../models/requestModel";
import { useSession } from "next-auth/client";
import Layout from "../components/layout";
import { Table } from "antd";
import "antd/lib/table/style/index.css";
import moment from "moment";

import { ranks, statuses } from "../util/datalist";
// import Select from "react-select";
import {
  formatterColored,
  TableSelect,
  getStatusColor,
  Expanded,
  Remarks,
} from "../components/Styles";
import axios from "axios";
import { checkAdmin, isMentor } from "../util/helper";
import { useRouter } from "next/dist/client/router";

export default function Mentors({ requests }) {
  const [session, loading] = useSession();
  const router = useRouter();
  const [isLogged, setIsLogged] = useState(false);
  const [query, setQuery] = useState({});
  const [user, setUser] = useState({});

  useEffect(async () => {
    if (!loading)
      if (!session) {
        router.push("/api/auth/signin");
      } else {
        await fetch("/api/user")
          .then((response) => response.json())
          .then((data) => {
            if (isMentor(data)) setIsLogged(true);
            setUser(data);
          });
      }
  }, [loading]);

  if (!isLogged)
    return (
      <>
        either loading or broken or you don;t have access. wait for a minute and
        if it doesn't work refresh
        <br />
        If it doesn't work still let Z know
      </>
    );

  const columns = [
    {
      dataIndex: "createdAt",
      title: "Created",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      dataIndex: "discordName",
      title: "Discord Username",
      render: (text) => (
        <div
          onClick={() => {
            navigator.clipboard.writeText(text);
          }}
        >
          {text}
        </div>
      ),
      sorter: (a, b) => `${a.discordName}`.localeCompare(b.discordName),
    },
    {
      dataIndex: "rank",
      title: "Rank",
      sorter: (a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank),
    },
    {
      dataIndex: "region",
      title: "Region",
      sorter: (a, b) => a.region.localeCompare(b.region),
    },
    {
      dataIndex: "summonerName",
      title: "OP.GG",
      render: (text, record, index) => (
        <a href={`https://${record.region}.op.gg/summoner/userName=${text}`}>
          {text}
        </a>
      ),
    },
    {
      dataIndex: "role",
      title: "Role",
      sorter: (a, b) => a.role.localeCompare(b.role),
    },
    { dataIndex: "champions", title: "Champions" },
    { dataIndex: "timezone", title: "Time Zone" },
    // { dataIndex: "info", title: "Additional Information", ellipsis: true },
    {
      dataIndex: "status",
      title: "Status",
      render: (text, record, index) => (
        <TableSelect
          className={text}
          options={formatterColored(statuses)}
          defaultValue={{
            label: text,
            value: text,
            color: getStatusColor(text),
          }}
          styles={colourStyles}
          onChange={(e) => handleStatusChange(e, record.id)}
        />
      ),
      width: 200,
      sorter: (a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status),
    },
    // {
    //   dataIndex: "accepted",
    //   title: "Accepted Date",
    //   sorter: (a, b) =>
    //     a.accepted && b.accepted
    //       ? new Date(a.accepted) - new Date(b.accepted)
    //       : 0,
    // },
    // {
    //   dataIndex: "completed",
    //   title: "Completed Date",
    //   sorter: (a, b) => new Date(a.completed) - new Date(b.completed),
    // },
    // { dataIndex: "mentor", title: "Accepted Mentor" },
  ];
  const dot = (color = "#ccc") => ({
    alignItems: "center",
    display: "flex",
    backgroundColor: color,

    ":before": {
      backgroundColor: color,
      borderRadius: 10,
      content: '" "',
      display: "block",
      marginRight: "8px",
      height: 10,
      width: 10,
    },
  });

  const handleStatusChange = async ({ value }, id) => {
    await axios
      .put("/api/request/change", { id, value, type: "status" })
      .then(() => {
        alert("successfully changed");
      })
      .catch(() => {
        alert("error, some shit gone wrong. nag Z about this");
      });
  };

  const colourStyles = {
    placeholder: (styles) => ({ ...styles, ...dot() }),
    singleValue: (styles, { data }) => ({ ...styles, ...dot(data.color) }),
  };
  const rows = requests.map((item) => {
    return {
      ...item,
      key: item.id,
      createdAt: moment(item.createdAt).format("l"),
      completed: item.completed ? moment(item.completed).format("l") : "",
      accepted: item.accepted ? moment(item.accepted).format("l") : "",
    };
  });

  const handleArchive = (id) => {
    if (confirm("Are you sure you want to archive this request?")) {
      axios.put("/api/request/change", { id, type: "archive" });
      console.log("archiving");
    } else console.log("not");
    console.log("general test");
  };

  return (
    <Layout>
      <div>
        <Table
          dataSource={rows}
          columns={columns}
          density="compact"
          autoHeight
          pagination={false}
          expandable={{
            expandedRowRender: (item) => (
              <Expanded>
                <p> Notes: {item.info} </p>
                <p>Accepted At: {item.accepted}</p>
                <p>Accepted Mentor: {item.mentor}</p>
                <p>Completed At: {item.completed}</p>
                <p>Discord ID: {item.discordId}</p>
                <Remarks id={item.id} content={item.remarks} />
                {checkAdmin(user) && (
                  <button onClick={() => handleArchive(item.id)}>
                    ARCHIVE THIS REQUEST
                  </button>
                )}
              </Expanded>
            ),
          }}
        />
      </div>
    </Layout>
  );
}

export async function getStaticProps(context) {
  await connectToDatabase();
  const requests = await Request.find({ archived: { $ne: true } })
    .select(" -updatedAt -__v")
    .populate("mentor")
    .then((items) => {
      return items.map((item) => {
        return {
          id: item._id.toString(),
          status: item.status,
          rank: item.rank,
          region: item.region,
          summonerName: item.summonerName || item.opgg || "what",
          role: item.role,
          champions: item.champions || null,
          timezone: item.timezone,
          info: item.info || null,
          createdAt: item.createdAt.toISOString(),
          discordName: item.discordName,
          discordId: item.discordId,
          accepted: item.accepted?.toISOString() || null,
          completed: item.completed?.toISOString() || null,
          mentor: item.mentor?.discordName || null,
          remarks: item.remarks || null,
        };
      });
    });

  return {
    props: {
      requests,
    },
    revalidate: 10,
  };
}
