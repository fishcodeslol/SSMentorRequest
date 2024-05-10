import React from "react";
import { Button, Flex } from "@mantine/core";
import Link from "next/link";
import Layout from "../../components/layout";
import { useRouter } from "next/router";
import useAuthTest from "../../hooks/useAuthTest";
import { MentorRequestComponent } from "../../components/MentorRequestComponents";

export default function MentorsRequests() {
  const router = useRouter();
  const { allRequests, isAdmin, loading, notAuth } = useAuthTest(
    "/api/admin/requests",
    true
  );

  return (
    <Layout loading={loading} notAuth={notAuth}>
      <Flex justify={'flex-end'}>
        <Button
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          onClick={() => router.push('/mentors/mentorguide')}
          >
          Mentor Guide
        </Button>
      </Flex>
      <MentorRequestComponent allRequests={allRequests} isAdmin={isAdmin} />
    </Layout>
  );
}
